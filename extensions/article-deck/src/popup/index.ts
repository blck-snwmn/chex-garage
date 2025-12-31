import type {
  ExtractedContent,
  GenerateSlideRequest,
  GenerateSlideResponse,
  SlideResult,
} from "../types.ts";

function isGenerateSlideResponse(value: unknown): value is GenerateSlideResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof value.success === "boolean"
  );
}

function hasSlideResult(
  response: GenerateSlideResponse,
): response is GenerateSlideResponse & { result: SlideResult } {
  return (
    response.result !== undefined &&
    typeof response.result.markdown === "string" &&
    typeof response.result.html === "string"
  );
}
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

function getButton(id: string): HTMLButtonElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error(`Required button #${id} not found`);
  }
  return el;
}

function getDiv(id: string): HTMLDivElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLDivElement)) {
    throw new Error(`Required div #${id} not found`);
  }
  return el;
}

function getAnchor(id: string): HTMLAnchorElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAnchorElement)) {
    throw new Error(`Required anchor #${id} not found`);
  }
  return el;
}

function getSpan(parent: Element, selector: string): HTMLSpanElement {
  const el = parent.querySelector(selector);
  if (!(el instanceof HTMLSpanElement)) {
    throw new Error(`Required span ${selector} not found`);
  }
  return el;
}

const generateBtn = getButton("generateBtn");
const btnText = getSpan(generateBtn, ".btn-text");
const btnLoading = getSpan(generateBtn, ".btn-loading");
const errorSection = getDiv("error");
const optionsLink = getAnchor("optionsLink");

let pageTitle = "slides";

function setLoading(loading: boolean) {
  generateBtn.disabled = loading;
  btnText.hidden = loading;
  btnLoading.hidden = !loading;
}

function showError(message: string) {
  errorSection.textContent = message;
  errorSection.hidden = false;
}

async function extractContent(): Promise<ExtractedContent | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    showError("No active tab found");
    return null;
  }

  pageTitle =
    tab.title?.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "_") || "slides";

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Get the HTML to process in the popup context where we have access to modules
        return {
          html: document.documentElement.outerHTML,
          url: document.location.href,
          title: document.title,
        };
      },
    });

    const pageData = results[0]?.result;
    if (!pageData) {
      showError("Failed to extract page content");
      return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(pageData.html, "text/html");

    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      showError("Failed to parse article content. This page may not have readable content.");
      return null;
    }

    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    turndownService.use(gfm);

    const content = article.content ?? "";
    const markdown = turndownService.turndown(content);

    return {
      title: article.title ?? "",
      content,
      markdown,
      url: pageData.url,
    };
  } catch (error) {
    showError(error instanceof Error ? error.message : "Failed to extract content");
    return null;
  }
}

async function generateSlides() {
  setLoading(true);
  errorSection.hidden = true;

  try {
    const content = await extractContent();
    if (!content) {
      setLoading(false);
      return;
    }

    const request: GenerateSlideRequest = {
      type: "GENERATE_SLIDE",
      content,
    };

    const rawResponse: unknown = await chrome.runtime.sendMessage(request);

    if (!isGenerateSlideResponse(rawResponse)) {
      showError("Invalid response from background script");
      return;
    }

    if (rawResponse.success && hasSlideResult(rawResponse)) {
      // Store the result and open preview automatically
      await chrome.storage.local.set({
        previewHtml: rawResponse.result.html,
        previewMarkdown: rawResponse.result.markdown,
        previewTitle: pageTitle,
      });

      // Open the preview page
      await chrome.tabs.create({
        url: chrome.runtime.getURL("preview/index.html"),
      });

      // Close the popup
      window.close();
    } else {
      showError(rawResponse.error ?? "Failed to generate slides");
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : "An error occurred");
  } finally {
    setLoading(false);
  }
}

generateBtn.addEventListener("click", generateSlides);
optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  void chrome.runtime.openOptionsPage();
});
