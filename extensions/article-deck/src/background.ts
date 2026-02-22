import { generateSlides, checkAvailability } from "./nano.ts";
import { convertToSlide } from "./marp.ts";
import type { MessageRequest, GenerateSlideResponse, ExtractedContent } from "./types.ts";

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
  const availability = await checkAvailability();
  if (!availability.summarizer || !availability.prompt) {
    const missing = [];
    if (!availability.summarizer) missing.push("Summarizer API");
    if (!availability.prompt) missing.push("Prompt API");
    return {
      success: false,
      error: `Chrome built-in AI is not available: ${missing.join(", ")} not supported. Requires Chrome 138+ with compatible hardware.`,
    };
  }

  try {
    const slideMarkdown = await generateSlides(content);
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
