function getDiv(id: string): HTMLDivElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLDivElement)) {
    throw new Error(`Required div #${id} not found`);
  }
  return el;
}

function getButton(id: string): HTMLButtonElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error(`Required button #${id} not found`);
  }
  return el;
}

const container = getDiv("preview-container");
const loading = getDiv("loading");
const printBtn = getButton("printBtn");
const downloadMdBtn = getButton("downloadMd");
const downloadHtmlBtn = getButton("downloadHtml");

let previewData: {
  html: string;
  markdown: string;
  title: string;
} | null = null;

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function init() {
  const data = await chrome.storage.local.get(["previewHtml", "previewMarkdown", "previewTitle"]);

  if (!data.previewHtml) {
    loading.textContent = "No preview data found";
    return;
  }

  // Store data for download functionality
  previewData = {
    html: data.previewHtml,
    markdown: data.previewMarkdown || "",
    title: data.previewTitle || "slides",
  };

  // Update page title
  document.title = `${previewData.title} - Article Deck`;

  // Create iframe with the HTML content
  const iframe = document.createElement("iframe");
  iframe.srcdoc = data.previewHtml;
  iframe.style.width = "100%";
  iframe.style.height = "calc(100vh - 120px)";
  iframe.style.border = "none";
  iframe.style.background = "white";

  loading.remove();
  container.appendChild(iframe);

  // Clean up storage after loading
  await chrome.storage.local.remove(["previewHtml", "previewMarkdown", "previewTitle"]);
}

printBtn.addEventListener("click", () => {
  const iframe = container.querySelector("iframe");
  if (iframe?.contentWindow) {
    iframe.contentWindow.print();
  }
});

downloadMdBtn.addEventListener("click", () => {
  if (!previewData) return;
  downloadFile(previewData.markdown, `${previewData.title}.md`, "text/markdown");
});

downloadHtmlBtn.addEventListener("click", () => {
  if (!previewData) return;
  downloadFile(previewData.html, `${previewData.title}.html`, "text/html");
});

void init();
