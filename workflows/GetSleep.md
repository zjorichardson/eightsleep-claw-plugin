# GetSleep Workflow

Retrieve sleep data and metrics from Eight Sleep.

## Steps

1. **Determine date range**
   - Default: yesterday (last night's sleep)
   - User may specify: specific date, or date range

2. **Run CLI command**
   ```bash
   cd ${CLAUDE_PROJECT_DIR}/.claude/skills/EightsleepClaw/tools

   # Last night's sleep
   npx ts-node eightsleep.ts sleep

   # Specific date
   npx ts-node eightsleep.ts sleep --date=YYYY-MM-DD

   # Date range
   npx ts-node eightsleep.ts sleep --from=YYYY-MM-DD --to=YYYY-MM-DD

   # Raw JSON (for analysis)
   npx ts-node eightsleep.ts sleep --format=full
   ```

3. **Present results**
   - Highlight sleep score
   - Note any significant deviations from typical patterns
   - Mention HRV and resting HR if available

## Output Interpretation

| Score Range | Quality |
|-------------|---------|
| 85-100 | Excellent |
| 70-84 | Good |
| 50-69 | Fair |
| Below 50 | Poor |

## Common Questions

- "How did I sleep?" → Run for yesterday
- "Sleep score last night" → Run for yesterday
- "How was my sleep on Monday?" → Calculate date, run for that date
- "Show sleep for the past week" → Calculate from/to dates for 7 days
