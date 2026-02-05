# GetStatus Workflow

Check the current status of the Eight Sleep pod.

## Steps

1. **Run CLI command**
   ```bash
   cd ${CLAUDE_PROJECT_DIR}/.claude/skills/EightsleepClaw/tools
   npx ts-node eightsleep.ts status
   ```

2. **Interpret results**
   - `state`: "off" or "on"
   - `temperatureLevel`: -100 to 100
     - Negative = cooling
     - Zero = neutral
     - Positive = warming

3. **Report to user**
   - Current state (on/off)
   - Current temperature setting
   - Human-readable description

## Temperature Interpretation

| Level | Description |
|-------|-------------|
| -100 to -50 | Heavy cooling |
| -49 to -20 | Moderate cooling |
| -19 to 0 | Light cooling |
| 1 to 20 | Light warming |
| 21 to 50 | Moderate warming |
| 51 to 100 | Heavy warming |
