# OpenClaw Eight Sleep Plugin

Private OpenClaw plugin for Eight Sleep pod control and sleep data.

## Features

- **eightsleep_status** - Get pod status (temperature, state)
- **eightsleep_sleep** - Get sleep data (score, stages, HRV, HR)
- **eightsleep_control** - Control pod (on/off, set temperature)
- **eightsleep_device** - Get device/user info

## Installation

```bash
cd openclaw-plugin-eightsleep
npm install
npm run build
```

Then add to your OpenClaw config:

```yaml
plugins:
  entries:
    eightsleep:
      enabled: true
      path: /path/to/openclaw-plugin-eightsleep
      config:
        email: your@email.com
        password: your-password
        timezone: America/Chicago  # optional
```

## Configuration

| Option | Description |
|--------|-------------|
| `email` | Eight Sleep account email |
| `password` | Eight Sleep account password |
| `timezone` | IANA timezone (default: America/Chicago) |
| `clientId` | Optional: custom OAuth client ID |
| `clientSecret` | Optional: custom OAuth client secret |

## Usage Examples

```
# Get sleep data from last night
eightsleep_sleep

# Get sleep data for specific date
eightsleep_sleep date=2026-02-01

# Get week of sleep data
eightsleep_sleep from=2026-01-27 to=2026-02-02

# Check pod status
eightsleep_status

# Turn pod on/off
eightsleep_control action=on
eightsleep_control action=off

# Set temperature (range: -100 to 100)
eightsleep_control action=temp level=-20  # cooling
eightsleep_control action=temp level=30   # heating
```

## Notes

- Uses the official Eight Sleep Android app credentials
- Tokens are cached in memory and auto-refreshed
- Temperature levels: negative = cooling, positive = heating
