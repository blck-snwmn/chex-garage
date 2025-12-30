import type {
  ExtractedContent,
  GenerateSlideRequest,
  GenerateSlideResponse,
} from "../types/index.ts";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const generateBtn = document.getElementById("generateBtn") as HTMLButtonElement;
const btnText = generateBtn.querySelector(".btn-text") as HTMLSpanElement;
const btnLoading = generateBtn.querySelector(".btn-loading") as HTMLSpanElement;
const errorSection = document.getElementById("error") as HTMLDivElement;
const optionsLink = document.getElementById("optionsLink") as HTMLAnchorElement;

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
  if (!tab.id) {
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

    const markdown = turndownService.turndown(article.content);

    return {
      title: article.title,
      content: article.content,
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

    const response = await chrome.runtime.sendMessage<GenerateSlideRequest, GenerateSlideResponse>(
      request,
    );

    if (response.success && response.result) {
      // Store the result and open preview automatically
      await chrome.storage.local.set({
        previewHtml: response.result.html,
        previewMarkdown: response.result.markdown,
        previewTitle: pageTitle,
      });

      // Open the preview page
      await chrome.tabs.create({
        url: chrome.runtime.getURL("preview/index.html"),
      });

      // Close the popup
      window.close();
    } else {
      showError(response.error || "Failed to generate slides");
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
  chrome.runtime.openOptionsPage();
});
