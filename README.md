# Eight Sleep Plugin for OpenClaw

An [OpenClaw](https://github.com/openclaw/openclaw) plugin for controlling your Eight Sleep Pod and accessing sleep data.

## Features

| Tool | Description |
|------|-------------|
| `eightsleep_status` | Get pod status (temperature level, on/off state) |
| `eightsleep_sleep` | Get sleep data (score, stages, HRV, heart rate, respiratory rate) |
| `eightsleep_control` | Control pod (turn on/off, set temperature) |
| `eightsleep_device` | Get device and user information |

## Installation

```bash
git clone https://github.com/zjorichardson/eightsleep-claw-plugin.git
cd eightsleep-claw-plugin
npm install
npm run build
```

## Configuration

Add to your OpenClaw gateway config:

```yaml
plugins:
  entries:
    eightsleep:
      enabled: true
      path: /path/to/eightsleep-claw-plugin
      config:
        email: "your-eightsleep-email@example.com"
        password: "your-eightsleep-password"
        timezone: "America/Chicago"  # optional, defaults to America/Chicago
```

### Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `email` | Yes | Your Eight Sleep account email |
| `password` | Yes | Your Eight Sleep account password |
| `timezone` | No | IANA timezone for sleep data (default: `America/Chicago`) |

> ⚠️ **Security Note:** Your credentials are only sent directly to Eight Sleep's authentication servers. They are never logged or stored by this plugin. Consider using environment variable substitution in your OpenClaw config for sensitive values.

## Usage Examples

### Get Last Night's Sleep Data
```
eightsleep_sleep
```

Returns a formatted summary including:
- Total sleep duration
- Sleep score (0-100)
- Sleep stages (deep, REM, light)
- Time in bed, fell asleep, woke up
- Heart rate and HRV metrics

### Get Sleep Data for a Specific Date
```
eightsleep_sleep date=2026-01-15
```

### Get Raw JSON Sleep Data
```
eightsleep_sleep format=full
```

### Get a Week of Sleep Data
```
eightsleep_sleep from=2026-01-01 to=2026-01-07
```

### Check Pod Status
```
eightsleep_status
```

### Control the Pod
```bash
# Turn on
eightsleep_control action=on

# Turn off
eightsleep_control action=off

# Set temperature (-100 = max cooling, 0 = neutral, 100 = max heating)
eightsleep_control action=temp level=-30   # cooling
eightsleep_control action=temp level=20    # warming
```

## How It Works

This plugin uses Eight Sleep's private API (the same one used by their mobile app). Authentication is handled via OAuth2 with automatic token refresh.

### API Endpoints Used

- `https://auth-api.8slp.net/v1/tokens` - OAuth authentication
- `https://client-api.8slp.net/v1/users/{userId}/temperature` - Pod status & control
- `https://client-api.8slp.net/v1/users/{userId}/trends` - Sleep data
- `https://client-api.8slp.net/v1/users/{userId}/devices/power` - Power control

### Rate Limiting

Eight Sleep's API has aggressive rate limiting. The plugin handles token caching to minimize auth requests, but avoid calling the API excessively.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Clean build artifacts
npm run clean
```

## Troubleshooting

### "Eight Sleep plugin not configured"
Make sure your gateway config has the `email` and `password` set in `plugins.entries.eightsleep.config`.

### Authentication Errors
- Verify your email/password are correct
- Check if you can log in to the Eight Sleep mobile app
- Eight Sleep may have rate-limited your IP; wait a few minutes and try again

### No Sleep Data
- Sleep data is typically available a few hours after waking
- Make sure you're querying the correct date (data is keyed by the night you went to sleep)

## License

MIT

## Disclaimer

This plugin is not affiliated with, endorsed by, or connected to Eight Sleep Inc. Use at your own risk. The Eight Sleep API is private and may change without notice.
