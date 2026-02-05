#!/usr/bin/env node
/**
 * Eight Sleep CLI for Auryn
 * Standalone CLI that wraps the EightSleepClient
 */

import { EightSleepClient } from "../dist/client.js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env from tools directory
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env") });

// Load credentials from environment
function getCredentials() {
  const email = process.env.EIGHTSLEEP_EMAIL;
  const password = process.env.EIGHTSLEEP_PASSWORD;
  const timezone = process.env.EIGHTSLEEP_TIMEZONE || "America/Chicago";

  if (!email || !password) {
    console.error("Error: EIGHTSLEEP_EMAIL and EIGHTSLEEP_PASSWORD environment variables required");
    console.error("Set them in your shell or create .env file in the tools directory");
    process.exit(1);
  }

  return { email, password, timezone };
}

function formatSleepSummary(day) {
  const hours = Math.floor(day.sleepDuration / 3600);
  const minutes = Math.floor((day.sleepDuration % 3600) / 60);
  const deepMins = Math.floor(day.deepDuration / 60);
  const remMins = Math.floor(day.remDuration / 60);
  const lightMins = Math.floor(day.lightDuration / 60);

  let summary = `Sleep Summary for ${day.day}\n`;
  summary += `${"=".repeat(40)}\n\n`;
  summary += `Total Sleep: ${hours}h ${minutes}m\n`;
  summary += `Sleep Score: ${day.score}/100\n\n`;
  summary += `Sleep Stages:\n`;
  summary += `  Deep: ${deepMins} min (${Math.round(day.deepPercent * 100)}%)\n`;
  summary += `  REM: ${remMins} min (${day.remPercent ? Math.round(day.remPercent * 100) : "~"}%)\n`;
  summary += `  Light: ${lightMins} min\n\n`;
  summary += `Times:\n`;
  summary += `  In bed: ${new Date(day.presenceStart).toLocaleTimeString()}\n`;
  summary += `  Fell asleep: ${new Date(day.sleepStart).toLocaleTimeString()}\n`;
  summary += `  Woke up: ${new Date(day.sleepEnd).toLocaleTimeString()}\n`;
  summary += `  Out of bed: ${new Date(day.presenceEnd).toLocaleTimeString()}\n\n`;
  summary += `Times woken: ${day.tnt}`;

  if (day.sleepQualityScore?.hrv?.current) {
    summary += `\n\nVitals:\n`;
    summary += `  Resting HR: ${day.sleepQualityScore.heartRate?.current || "N/A"} bpm\n`;
    summary += `  HRV: ${Math.round(day.sleepQualityScore.hrv.current)} ms`;
  }

  return summary;
}

function printHelp() {
  console.log(`
Eight Sleep CLI for Auryn

USAGE:
  node eightsleep.js <command> [options]

COMMANDS:
  status              Get pod status (temperature, on/off state)
  sleep [options]     Get sleep data
  control <action>    Control the pod
  device [type]       Get device or user info

SLEEP OPTIONS:
  --date=YYYY-MM-DD   Get sleep for specific date (default: yesterday)
  --from=YYYY-MM-DD   Start date for range query
  --to=YYYY-MM-DD     End date for range query
  --format=summary    Human readable output (default)
  --format=full       Raw JSON output

CONTROL ACTIONS:
  on                  Turn pod on
  off                 Turn pod off
  temp <level>        Set temperature (-100 to 100)

ENVIRONMENT:
  EIGHTSLEEP_EMAIL     Your Eight Sleep account email (required)
  EIGHTSLEEP_PASSWORD  Your Eight Sleep account password (required)
  EIGHTSLEEP_TIMEZONE  IANA timezone (default: America/Chicago)

EXAMPLES:
  node eightsleep.js sleep
  node eightsleep.js sleep --date=2026-01-15
  node eightsleep.js status
  node eightsleep.js control on
  node eightsleep.js control temp -30
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  const creds = getCredentials();
  const client = new EightSleepClient(creds);

  try {
    switch (command) {
      case "status": {
        const status = await client.getStatus();
        console.log(JSON.stringify({
          temperatureLevel: status.currentLevel,
          state: status.currentState.type,
          description: `Pod is ${status.currentState.type}, temperature level: ${status.currentLevel} (range: -100 to 100)`,
        }, null, 2));
        break;
      }

      case "sleep": {
        const dateArg = args.find(a => a.startsWith("--date="));
        const fromArg = args.find(a => a.startsWith("--from="));
        const toArg = args.find(a => a.startsWith("--to="));
        const formatArg = args.find(a => a.startsWith("--format="));

        const date = dateArg?.split("=")[1];
        const from = fromArg?.split("=")[1];
        const to = toArg?.split("=")[1];
        const format = formatArg?.split("=")[1] || "summary";

        let days;

        if (from && to) {
          days = await client.getSleepRange(from, to);
        } else {
          const queryDate = date ||
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          const day = await client.getSleepDay(queryDate);
          days = day ? [day] : [];
        }

        if (days.length === 0) {
          console.log("No sleep data found for the specified date(s).");
          process.exit(1);
        }

        if (format === "summary") {
          console.log(days.map(formatSleepSummary).join("\n\n---\n\n"));
        } else {
          console.log(JSON.stringify(days, null, 2));
        }
        break;
      }

      case "control": {
        const action = args[1];
        if (!action) {
          console.error("Error: control requires an action (on, off, temp)");
          process.exit(1);
        }

        switch (action) {
          case "on":
            await client.turnOn();
            console.log("Pod turned on");
            break;
          case "off":
            await client.turnOff();
            console.log("Pod turned off");
            break;
          case "temp": {
            const level = parseInt(args[2], 10);
            if (isNaN(level) || level < -100 || level > 100) {
              console.error("Error: temp requires a level between -100 and 100");
              process.exit(1);
            }
            await client.setTemperature(level);
            const desc = level < 0 ? "cooling" : level > 0 ? "heating" : "neutral";
            console.log(`Temperature set to ${level} (${desc})`);
            break;
          }
          default:
            console.error(`Unknown action: ${action}`);
            process.exit(1);
        }
        break;
      }

      case "device": {
        const type = args[1] || "device";
        const data = type === "user"
          ? await client.getUserInfo()
          : await client.getDeviceInfo();
        console.log(JSON.stringify(data, null, 2));
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
