# ControlPod Workflow

Control the Eight Sleep pod: turn on/off or adjust temperature.

## Operations

### Turn On
```bash
cd ${CLAUDE_PROJECT_DIR}/.claude/skills/EightsleepClaw/tools
npx ts-node eightsleep.ts control on
```

### Turn Off
```bash
cd ${CLAUDE_PROJECT_DIR}/.claude/skills/EightsleepClaw/tools
npx ts-node eightsleep.ts control off
```

### Set Temperature
```bash
cd ${CLAUDE_PROJECT_DIR}/.claude/skills/EightsleepClaw/tools
npx ts-node eightsleep.ts control temp <level>
```

## Temperature Guidelines

| User Request | Suggested Level |
|--------------|-----------------|
| "Make it cooler" | -30 |
| "Much cooler" / "cold" | -50 to -70 |
| "Maximum cooling" | -100 |
| "Make it warmer" | 30 |
| "Much warmer" / "hot" | 50 to 70 |
| "Maximum warming" | 100 |
| "Turn off heating/cooling" | 0 |

## Safety Notes

- Temperature changes take effect gradually
- Pod must be on for temperature to work
- If turning on and setting temp, do both commands:
  ```bash
  npx ts-node eightsleep.ts control on
  npx ts-node eightsleep.ts control temp -30
  ```

## Confirmation

Always confirm the action taken:
- "Pod turned on"
- "Pod turned off"
- "Temperature set to -30 (moderate cooling)"
