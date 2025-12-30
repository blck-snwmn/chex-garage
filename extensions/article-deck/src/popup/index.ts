import type {
  ExtractedContent,
  GenerateSlideRequest,
  GenerateSlideResponse,
  SlideResult,
} from "../types/index.ts";

const generateBtn = document.getElementById("generateBtn") as HTMLButtonElement;
const btnText = generateBtn.querySelector(".btn-text") as HTMLSpanElement;
const btnLoading = generateBtn.querySelector(".btn-loading") as HTMLSpanElement;
const resultSection = document.getElementById("result") as HTMLDivElement;
const errorSection = document.getElementById("error") as HTMLDivElement;
const downloadMdBtn = document.getElementById("downloadMd") as HTMLButtonElement;
const downloadHtmlBtn = document.getElementById("downloadHtml") as HTMLButtonElement;
const previewBtn = document.getElementById("previewBtn") as HTMLButtonElement;
const optionsLink = document.getElementById("optionsLink") as HTMLAnchorElement;

let currentResult: SlideResult | null = null;
let pageTitle = "slides";

function setLoading(loading: boolean) {
  generateBtn.disabled = loading;
  btnText.hidden = loading;
  btnLoading.hidden = !loading;
}

function showError(message: string) {
  errorSection.textContent = message;
  errorSection.hidden = false;
  resultSection.hidden = true;
}

function showResult(result: SlideResult) {
  currentResult = result;
  errorSection.hidden = true;
  resultSection.hidden = false;
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

    // Process the HTML in the popup context where we have access to modules
    const { Readability } = await import("@mozilla/readability");
    const TurndownService = (await import("turndown")).default;
    const { gfm } = await import("turndown-plugin-gfm");

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
  resultSection.hidden = true;

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
      showResult(response.result);
    } else {
      showError(response.error || "Failed to generate slides");
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : "An error occurred");
  } finally {
    setLoading(false);
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadMarkdown() {
  if (!currentResult) return;
  downloadFile(currentResult.markdown, `${pageTitle}.md`, "text/markdown");
}

function downloadHtml() {
  if (!currentResult) return;
  downloadFile(currentResult.html, `${pageTitle}.html`, "text/html");
}

async function openPreview() {
  if (!currentResult) return;

  // Store the HTML in storage temporarily
  await chrome.storage.local.set({
    previewHtml: currentResult.html,
    previewTitle: pageTitle,
  });

  // Open the preview page
  chrome.tabs.create({
    url: chrome.runtime.getURL("preview/index.html"),
  });
}

generateBtn.addEventListener("click", generateSlides);
downloadMdBtn.addEventListener("click", downloadMarkdown);
downloadHtmlBtn.addEventListener("click", downloadHtml);
previewBtn.addEventListener("click", openPreview);
optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
