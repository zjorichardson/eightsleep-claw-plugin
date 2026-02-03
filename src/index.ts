import { Type } from "@sinclair/typebox";
import { EightSleepClient, type EightSleepCredentials } from "./client.js";
import type { PluginApi, EightSleepConfig, SleepDay } from "./types.js";

function getConfig(api: PluginApi): EightSleepCredentials | null {
  const config = api.config.plugins?.entries?.eightsleep?.config as
    | EightSleepConfig
    | undefined;
  if (!config?.email || !config?.password) {
    return null;
  }
  return {
    email: config.email,
    password: config.password,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    timezone: config.timezone,
  };
}

function formatSleepSummary(day: SleepDay): string {
  const hours = Math.floor(day.sleepDuration / 3600);
  const minutes = Math.floor((day.sleepDuration % 3600) / 60);
  const deepMins = Math.floor(day.deepDuration / 60);
  const remMins = Math.floor(day.remDuration / 60);
  const lightMins = Math.floor(day.lightDuration / 60);

  let summary = `📊 **Sleep Summary for ${day.day}**\n\n`;
  summary += `🛏️ **Total Sleep:** ${hours}h ${minutes}m\n`;
  summary += `⭐ **Sleep Score:** ${day.score}/100\n\n`;
  summary += `**Sleep Stages:**\n`;
  summary += `  🌙 Deep: ${deepMins} min (${Math.round(day.deepPercent * 100)}%)\n`;
  summary += `  💭 REM: ${remMins} min (${day.remPercent ? Math.round(day.remPercent * 100) : "~"}%)\n`;
  summary += `  😴 Light: ${lightMins} min\n\n`;
  summary += `**Times:**\n`;
  summary += `  🌃 In bed: ${new Date(day.presenceStart).toLocaleTimeString()}\n`;
  summary += `  😴 Fell asleep: ${new Date(day.sleepStart).toLocaleTimeString()}\n`;
  summary += `  ☀️ Woke up: ${new Date(day.sleepEnd).toLocaleTimeString()}\n`;
  summary += `  🚶 Out of bed: ${new Date(day.presenceEnd).toLocaleTimeString()}\n\n`;
  summary += `📈 Times woken: ${day.tnt}`;

  // Add HRV/HR if available
  if (day.sleepQualityScore?.hrv?.current) {
    summary += `\n\n**Vitals:**\n`;
    summary += `  💓 Resting HR: ${day.sleepQualityScore.heartRate?.current || "N/A"} bpm\n`;
    summary += `  📊 HRV: ${Math.round(day.sleepQualityScore.hrv.current)} ms`;
  }

  return summary;
}

export default function register(api: PluginApi) {
  // eightsleep_status - Get pod status
  api.registerTool({
    name: "eightsleep_status",
    description: "Get Eight Sleep pod status including current temperature level and state.",
    parameters: Type.Object({}),
    async execute() {
      const cfg = getConfig(api);
      if (!cfg) {
        return {
          content: [{ type: "text", text: "Eight Sleep plugin not configured. Set email and password in plugins.entries.eightsleep.config" }],
        };
      }

      try {
        const client = new EightSleepClient(cfg);
        const status = await client.getStatus();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              temperatureLevel: status.currentLevel,
              state: status.currentState.type,
              description: `Pod is ${status.currentState.type}, temperature level: ${status.currentLevel} (range: -100 to 100)`,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  });

  // eightsleep_sleep - Get sleep data
  api.registerTool({
    name: "eightsleep_sleep",
    description: "Get sleep data and metrics from Eight Sleep. Returns sleep score, stages, HRV, heart rate, and more.",
    parameters: Type.Object({
      date: Type.Optional(
        Type.String({ description: "Date in YYYY-MM-DD format (default: yesterday)" })
      ),
      from: Type.Optional(
        Type.String({ description: "Start date for range query (YYYY-MM-DD)" })
      ),
      to: Type.Optional(
        Type.String({ description: "End date for range query (YYYY-MM-DD)" })
      ),
      format: Type.Optional(
        Type.Union([Type.Literal("summary"), Type.Literal("full")], {
          description: "Output format: summary (human readable) or full (raw JSON)",
        })
      ),
    }),
    async execute(_id, params) {
      const cfg = getConfig(api);
      if (!cfg) {
        return {
          content: [{ type: "text", text: "Eight Sleep plugin not configured." }],
        };
      }

      try {
        const client = new EightSleepClient(cfg);
        const format = (params.format as "summary" | "full") || "summary";
        const from = params.from as string | undefined;
        const to = params.to as string | undefined;

        let days: SleepDay[];

        if (from && to) {
          days = await client.getSleepRange(from, to);
        } else {
          const date = (params.date as string) || 
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          const day = await client.getSleepDay(date);
          days = day ? [day] : [];
        }

        if (days.length === 0) {
          return {
            content: [{ type: "text", text: "No sleep data found for the specified date(s)." }],
          };
        }

        if (format === "summary") {
          const summaries = days.map(formatSleepSummary).join("\n\n---\n\n");
          return { content: [{ type: "text", text: summaries }] };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(days, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  });

  // eightsleep_control - Control the pod
  api.registerTool({
    name: "eightsleep_control",
    description: "Control Eight Sleep pod: turn on/off or set temperature level.",
    parameters: Type.Object({
      action: Type.Union(
        [Type.Literal("on"), Type.Literal("off"), Type.Literal("temp")],
        { description: "Action to perform: on, off, or temp" }
      ),
      level: Type.Optional(
        Type.Number({ 
          description: "Temperature level (-100 to 100). Required for 'temp' action. Negative = cooling, positive = heating.",
          minimum: -100,
          maximum: 100,
        })
      ),
    }),
    async execute(_id, params) {
      const cfg = getConfig(api);
      if (!cfg) {
        return {
          content: [{ type: "text", text: "Eight Sleep plugin not configured." }],
        };
      }

      try {
        const client = new EightSleepClient(cfg);
        const action = params.action as "on" | "off" | "temp";
        const level = params.level as number | undefined;

        switch (action) {
          case "on":
            await client.turnOn();
            return { content: [{ type: "text", text: "✅ Pod turned on" }] };

          case "off":
            await client.turnOff();
            return { content: [{ type: "text", text: "✅ Pod turned off" }] };

          case "temp":
            if (level === undefined) {
              return {
                content: [{ type: "text", text: "Error: 'level' parameter required for temp action" }],
                isError: true,
              };
            }
            await client.setTemperature(level);
            const desc = level < 0 ? "cooling" : level > 0 ? "heating" : "neutral";
            return { 
              content: [{ type: "text", text: `✅ Temperature set to ${level} (${desc})` }] 
            };

          default:
            return {
              content: [{ type: "text", text: `Unknown action: ${action}` }],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  });

  // eightsleep_device - Get device info
  api.registerTool({
    name: "eightsleep_device",
    description: "Get Eight Sleep device and user information.",
    parameters: Type.Object({
      info: Type.Optional(
        Type.Union([Type.Literal("user"), Type.Literal("device")], {
          description: "What info to retrieve: user or device (default: device)",
        })
      ),
    }),
    async execute(_id, params) {
      const cfg = getConfig(api);
      if (!cfg) {
        return {
          content: [{ type: "text", text: "Eight Sleep plugin not configured." }],
        };
      }

      try {
        const client = new EightSleepClient(cfg);
        const info = (params.info as "user" | "device") || "device";

        const data = info === "user" 
          ? await client.getUserInfo()
          : await client.getDeviceInfo();

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  });

  api.logger.info("Eight Sleep plugin registered");
}
