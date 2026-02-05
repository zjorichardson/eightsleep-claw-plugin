# GetDevice Workflow

Get Eight Sleep device or user account information.

## Steps

### Get Device Info
```bash
cd ${CLAUDE_PROJECT_DIR}/.claude/skills/EightsleepClaw/tools
npx ts-node eightsleep.ts device
```

### Get User Info
```bash
cd ${CLAUDE_PROJECT_DIR}/.claude/skills/EightsleepClaw/tools
npx ts-node eightsleep.ts device user
```

## Use Cases

- Troubleshooting connectivity
- Checking device firmware
- Verifying account settings
- Getting device serial number
