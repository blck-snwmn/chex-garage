const HOST_NAME = "com.chex_garage.native_bridge";

let port: chrome.runtime.Port | undefined;

function connect(): void {
  port = chrome.runtime.connectNative(HOST_NAME);
  port.onMessage.addListener((message: unknown) => {
    if (
      typeof message === "object" &&
      message !== null &&
      "text" in message &&
      typeof message.text === "string"
    ) {
      void showNotification(message.text);
    }
  });
  port.onDisconnect.addListener(() => {
    port = undefined;
    setTimeout(connect, 3_000);
  });
}

async function showNotification(text: string): Promise<void> {
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
      title: "Message from native console",
      message: text,
    });
    port?.postMessage({ text: "Chrome notification created" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    port?.postMessage({ text: `Chrome notification failed: ${detail}` });
  }
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (
    typeof message !== "object" ||
    message === null ||
    !("text" in message) ||
    typeof message.text !== "string"
  ) {
    return false;
  }
  if (!port) {
    sendResponse({ ok: false, error: "Native Host is not connected" });
    return false;
  }

  port.postMessage({ text: message.text });
  sendResponse({ ok: true });
  return false;
});

connect();
