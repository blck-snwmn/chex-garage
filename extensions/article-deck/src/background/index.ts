import { generateSlides } from "../lib/gemini.ts";
import { convertToSlide } from "../lib/marp.ts";
import { getApiKey } from "../lib/storage.ts";
import type { MessageRequest, GenerateSlideResponse, ExtractedContent } from "../types/index.ts";

chrome.runtime.onMessage.addListener(
  (
    message: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: GenerateSlideResponse) => void,
  ) => {
    if (message.type === "GENERATE_SLIDE") {
      handleGenerateSlide(message.content)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        });
      return true; // Keep message channel open for async response
    }
    return false;
  },
);

async function handleGenerateSlide(content: ExtractedContent): Promise<GenerateSlideResponse> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "API key not configured. Please set it in the options page.",
    };
  }

  try {
    const slideMarkdown = await generateSlides(apiKey, content);
    const result = convertToSlide(slideMarkdown);

    return {
      success: true,
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate slides",
    };
  }
}

console.log("Article Deck background script loaded");
