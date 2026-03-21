# distill-server

A local HTTP server that saves AI conversations to an Obsidian vault as Markdown.

## Environment Variables

| Variable           | Required | Description                  |
| ------------------ | -------- | ---------------------------- |
| `SHELF_VAULT_PATH` | Yes      | Path to the Obsidian vault   |
| `SHELF_PORT`       | No       | Port number (default: 18234) |

## Manual Start

```bash
cd packages/distill-server
SHELF_VAULT_PATH=/path/to/vault bun run start

# Watch mode
SHELF_VAULT_PATH=/path/to/vault bun run dev
```

## Running as a Daemon on macOS (launchd)

### Register

1. Create the plist file:

```bash
cat > ~/Library/LaunchAgents/com.chex.distill-server.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.chex.distill-server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/bun</string>
        <string>run</string>
        <string>src/index.ts</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/chex-garage/packages/distill-server</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>SHELF_VAULT_PATH</key>
        <string>/path/to/obsidian/vault</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/distill-server.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/distill-server.stderr.log</string>
</dict>
</plist>
EOF
```

> Run `which bun` to find the path to the `bun` binary.

2. Register and start the service:

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.chex.distill-server.plist
```

### Restart

```bash
launchctl kickstart -k gui/$(id -u)/com.chex.distill-server
```

### Unregister

```bash
launchctl bootout gui/$(id -u)/com.chex.distill-server
```

### Logs

```bash
tail -f /tmp/distill-server.stdout.log
tail -f /tmp/distill-server.stderr.log
```
