import { chmodSync, existsSync, lstatSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { createConnection, createServer, type Socket } from "node:net";
import { createInterface } from "node:readline";

interface Message {
  text: string;
}

const HOST_NAME = "com.chex_garage.native_bridge";
const runtimeDirectory =
  process.env.CHEX_NATIVE_BRIDGE_RUNTIME_DIRECTORY ??
  join(homedir(), "Library", "Caches", "chex-garage-native-bridge");
const socketPath = join(runtimeDirectory, "bridge.sock");

export class NativeMessageDecoder {
  private buffer = Buffer.alloc(0);

  push(chunk: Uint8Array): Message[] {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const messages: Message[] = [];

    while (this.buffer.length >= 4) {
      const length = this.buffer.readUInt32LE(0);
      if (length > 64 * 1024) {
        throw new Error("Message is too large");
      }
      if (this.buffer.length < length + 4) {
        break;
      }

      const value = JSON.parse(this.buffer.subarray(4, length + 4).toString("utf8"));
      this.buffer = this.buffer.subarray(length + 4);
      if (isMessage(value)) {
        messages.push(value);
      }
    }
    return messages;
  }
}

export function encodeNativeMessage(message: Message): Buffer {
  const body = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(body.length);
  return Buffer.concat([header, body]);
}

async function runConsole(): Promise<void> {
  mkdirSync(runtimeDirectory, { recursive: true, mode: 0o700 });
  chmodSync(runtimeDirectory, 0o700);
  if (existsSync(socketPath)) {
    if (!lstatSync(socketPath).isSocket()) {
      throw new Error(`Refusing to replace non-socket path: ${socketPath}`);
    }
    rmSync(socketPath);
  }

  let host: Socket | undefined;
  const server = createServer((socket) => {
    host?.destroy();
    host = socket;
    socket.setEncoding("utf8");
    let buffer = "";
    console.log("[system] Chrome connected");

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const value = JSON.parse(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (isMessage(value)) {
          console.log(`[chrome] ${value.text}`);
        }
        newline = buffer.indexOf("\n");
      }
    });
    socket.on("close", () => {
      if (host === socket) {
        host = undefined;
        console.log("[system] Chrome disconnected");
      }
    });
  });

  server.listen(socketPath, () => {
    chmodSync(socketPath, 0o600);
    console.log("Native console started. Enter a message for Chrome.");
  });

  const input = createInterface({ input: process.stdin });
  input.on("line", (text) => {
    if (host && text.trim()) {
      host.write(`${JSON.stringify({ text: text.trim() })}\n`);
    }
  });

  const stop = (): void => {
    input.close();
    host?.destroy();
    server.close();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  server.once("close", () => {
    if (existsSync(socketPath) && lstatSync(socketPath).isSocket()) {
      rmSync(socketPath);
    }
  });
}

async function runHost(): Promise<void> {
  let consoleSocket: Socket | undefined;
  let stopped = false;

  const connect = (): void => {
    if (stopped) {
      return;
    }
    const socket = createConnection(socketPath);
    socket.setEncoding("utf8");
    let buffer = "";
    consoleSocket = socket;

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const value = JSON.parse(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (isMessage(value)) {
          process.stdout.write(encodeNativeMessage(value));
        }
        newline = buffer.indexOf("\n");
      }
    });
    socket.on("error", () => undefined);
    socket.on("close", () => {
      if (consoleSocket === socket) {
        consoleSocket = undefined;
      }
      if (!stopped) {
        setTimeout(connect, 1_000);
      }
    });
  };
  connect();

  const decoder = new NativeMessageDecoder();
  for await (const chunk of Bun.stdin.stream()) {
    for (const message of decoder.push(chunk)) {
      consoleSocket?.write(`${JSON.stringify(message)}\n`);
    }
  }
  stopped = true;
  consoleSocket?.destroy();
}

function install(extensionId: string): void {
  if (!/^[a-p]{32}$/.test(extensionId)) {
    throw new Error("Invalid Chrome extension ID");
  }
  const executable = resolve(process.execPath);
  if (basename(executable).startsWith("bun")) {
    throw new Error("Build the standalone executable before installing");
  }

  const manifestPath = join(
    homedir(),
    "Library",
    "Application Support",
    "Google",
    "Chrome",
    "NativeMessagingHosts",
    `${HOST_NAME}.json`,
  );
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        name: HOST_NAME,
        description: "Chex Garage Native Messaging bridge",
        path: executable,
        type: "stdio",
        allowed_origins: [`chrome-extension://${extensionId}/`],
      },
      undefined,
      2,
    )}\n`,
  );
  console.log(`Installed ${manifestPath}`);
}

function isMessage(value: unknown): value is Message {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof value.text === "string" &&
    value.text.length > 0 &&
    new TextEncoder().encode(value.text).byteLength <= 64 * 1024
  );
}

async function main(): Promise<void> {
  const [command, argument] = process.argv.slice(2);
  if (command === "console") {
    await runConsole();
  } else if (command === "install" && argument) {
    install(argument);
  } else if (command === "host" || command?.startsWith("chrome-extension://")) {
    await runHost();
  } else {
    console.log("Usage: native-bridge console | install <extension-id>");
  }
}

if (import.meta.main) {
  await main();
}
