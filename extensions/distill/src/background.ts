import type { BackgroundToContent, ContentToBackground } from "./types.ts";
import { saveConversation } from "./client.ts";

async function handleSave(data: ContentToBackground["data"]): Promise<void> {
  const result = await saveConversation(data);

  if (!result.success) {
    console.error("Distill: save failed:", result.error);
  } else {
    console.log("Distill: saved to", result.filePath);
  }
}

chrome.runtime.onMessage.addListener(
  (
    message: ContentToBackground,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response?: unknown) => void,
  ) => {
    if (message.type === "AUTO_SAVE" || message.type === "SAVE_CONVERSATION") {
      void handleSave(message.data);
    }
    return undefined;
  },
);

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  const tabId = tab.id;
  const message: BackgroundToContent = { type: "EXTRACT_AND_SAVE" };
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    console.warn("Distill: content script not ready, injecting and retrying...");
    chrome.scripting
      .executeScript({ target: { tabId }, files: ["sites/chatgpt.com/index.js"] })
      .then(() => chrome.tabs.sendMessage(tabId, message))
      .catch((err) => console.error("Distill: failed to inject content script:", err));
  });
});
