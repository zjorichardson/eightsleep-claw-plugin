---
name: EightsleepClaw
description: Eight Sleep pod control and sleep data tracking. USE WHEN user mentions eight sleep, sleep data, sleep score, pod temperature, bed temperature, sleep tracking, HRV from bed, sleep stages, OR wants to control their Eight Sleep mattress.
---

# EightsleepClaw

Control your Eight Sleep Pod and access sleep metrics. Get sleep scores, stages, HRV, heart rate, and control bed temperature.

---

## Workflow Routing

**When executing a workflow, output this notification:**

```
Running the **WorkflowName** workflow from the **EightsleepClaw** skill...
```

| Workflow | Trigger | File |
|----------|---------|------|
| **GetSleep** | "how did I sleep", "sleep score", "sleep data", "last night" | `workflows/GetSleep.md` |
| **GetStatus** | "pod status", "bed temperature", "is pod on" | `workflows/GetStatus.md` |
| **ControlPod** | "turn on pod", "turn off bed", "set temperature", "make bed cooler/warmer" | `workflows/ControlPod.md` |
| **GetDevice** | "device info", "eight sleep account" | `workflows/GetDevice.md` |

## Examples

**Example 1: Check last night's sleep**
```
User: "How did I sleep last night?"
-> Invokes GetSleep workflow
-> Runs: cd $SKILL_DIR/tools && npx ts-node eightsleep.ts sleep
-> Returns sleep score, duration, stages, HRV, heart rate
```

**Example 2: Cool down the bed**
```
User: "Make my bed cooler"
-> Invokes ControlPod workflow
-> Runs: cd $SKILL_DIR/tools && npx ts-node eightsleep.ts control temp -30
-> Confirms temperature set to cooling level
```

**Example 3: Check sleep trend**
```
User: "Show me my sleep for the past week"
-> Invokes GetSleep workflow
-> Runs: cd $SKILL_DIR/tools && npx ts-node eightsleep.ts sleep --from=2026-01-28 --to=2026-02-04
-> Returns daily sleep summaries for the date range
```

**Example 4: Turn off pod before leaving**
```
User: "Turn off the Eight Sleep"
-> Invokes ControlPod workflow
-> Runs: cd $SKILL_DIR/tools && npx ts-node eightsleep.ts control off
-> Confirms pod is off
```

---

## CLI Reference

**Location:** `${CLAUDE_PROJECT_DIR}/.claude/skills/EightsleepClaw/tools/eightsleep.ts`

### Commands

```bash
cd ${CLAUDE_PROJECT_DIR}/.claude/skills/EightsleepClaw/tools

# Get pod status
npx ts-node eightsleep.ts status

# Get last night's sleep
npx ts-node eightsleep.ts sleep

# Get sleep for specific date
npx ts-node eightsleep.ts sleep --date=2026-01-15

# Get sleep range
npx ts-node eightsleep.ts sleep --from=2026-01-01 --to=2026-01-07

# Get raw JSON output
npx ts-node eightsleep.ts sleep --format=full

# Turn pod on/off
npx ts-node eightsleep.ts control on
npx ts-node eightsleep.ts control off

# Set temperature (-100 to 100)
npx ts-node eightsleep.ts control temp -30  # cooling
npx ts-node eightsleep.ts control temp 20   # warming

# Get device/user info
npx ts-node eightsleep.ts device
npx ts-node eightsleep.ts device user
```

### Temperature Scale

| Level | Description |
|-------|-------------|
| -100 | Maximum cooling |
| -50 | Strong cooling |
| -30 | Moderate cooling |
| 0 | Neutral (no heating/cooling) |
| 30 | Moderate warming |
| 50 | Strong warming |
| 100 | Maximum warming |

---

## Configuration

**Required Environment Variables:**

```bash
export EIGHTSLEEP_EMAIL="your-email@example.com"
export EIGHTSLEEP_PASSWORD="your-password"
export EIGHTSLEEP_TIMEZONE="America/Chicago"  # optional
```

Or create `.env` file in the tools directory.

---

## Sleep Metrics Explained

| Metric | Description |
|--------|-------------|
| **Sleep Score** | Overall sleep quality (0-100) |
| **Deep Sleep** | Restorative sleep for physical recovery |
| **REM Sleep** | Dream sleep, important for memory/learning |
| **Light Sleep** | Transitional sleep stages |
| **HRV** | Heart rate variability (higher = better recovery) |
| **Resting HR** | Heart rate during sleep |
| **Times Woken** | Number of wake events during night |

---

## Dependencies

- Node.js with TypeScript support
- Environment variables for Eight Sleep credentials
- Network access to Eight Sleep API

## Rate Limiting

Eight Sleep's API has aggressive rate limiting. Avoid making many requests in quick succession. The client handles token caching automatically.
