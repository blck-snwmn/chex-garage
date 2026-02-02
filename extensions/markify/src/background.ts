interface ExtractResult {
  success: boolean;
  title?: string;
  markdown?: string;
  error?: string;
}

function isExtractResult(value: unknown): value is ExtractResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "success" in value && typeof value.success === "boolean";
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100);
}

async function showError(message: string): Promise<void> {
  await chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-48.png",
    title: "Markify",
    message,
  });
}

async function handleClick(tab: chrome.tabs.Tab): Promise<void> {
  try {
    if (!tab.id || !tab.url) {
      await showError("No active tab found");
      return;
    }

    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
      await showError("Cannot extract from browser pages");
      return;
    }

    const tabId = tab.id;

    const extractResults = await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });

    const rawResult = extractResults[0]?.result;
    if (!isExtractResult(rawResult)) {
      await showError("Failed to extract content");
      return;
    }

    const { success, markdown, title, error } = rawResult;

    if (!success || !markdown || !title) {
      await showError(error || "Could not extract content from this page");
      return;
    }

    const filename = `${sanitizeFilename(title)}.md`;
    const dataUrl = `data:text/markdown;base64,${btoa(unescape(encodeURIComponent(markdown)))}`;

    await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
    });

    await chrome.storage.local.set({ clipboardText: markdown });

    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        chrome.storage.local.get("clipboardText", (data: { clipboardText?: string }) => {
          if (data.clipboardText) {
            void navigator.clipboard.writeText(data.clipboardText);
            void chrome.storage.local.remove("clipboardText");
          }
        });
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    await showError(message);
  }
}

chrome.action.onClicked.addListener((tab) => {
  void handleClick(tab);
});
