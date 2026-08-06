# Native Bridge Demo

A bidirectional Native Messaging sample for Chrome and macOS.

```text
Chrome extension <-> Native Messaging Host <-> Unix socket <-> terminal console
```

Messages sent from the extension are printed by the terminal console. Lines entered in the terminal console produce a Chrome notification.

## Build

From the repository root:

```bash
bun run build
```

The extension is written to `extensions/native-bridge/dist` and the standalone native executable is written to `packages/native-bridge/dist/native-bridge`.

## Install and run

1. Open `chrome://extensions`, enable Developer mode, and load `extensions/native-bridge/dist` as an unpacked extension.
2. Copy the extension ID shown by Chrome.
3. Register the Native Messaging Host:

   ```bash
   packages/native-bridge/dist/native-bridge install EXTENSION_ID
   ```

4. Reload the extension from `chrome://extensions`.
5. Start the terminal console and leave it running:

   ```bash
   packages/native-bridge/dist/native-bridge console
   ```

Open the extension popup to send a message to the console. Enter a line in the console to display it as a Chrome notification.

The console owns a user-only Unix socket at `~/Library/Caches/chex-garage-native-bridge/bridge.sock`. The Native Messaging Host reconnects automatically when the console is restarted.
