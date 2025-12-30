const container = document.getElementById("preview-container") as HTMLDivElement;
const loading = document.getElementById("loading") as HTMLDivElement;
const printBtn = document.getElementById("printBtn") as HTMLButtonElement;
const closeBtn = document.getElementById("closeBtn") as HTMLButtonElement;

async function init() {
  const data = await chrome.storage.local.get(["previewHtml", "previewTitle"]);

  if (!data.previewHtml) {
    loading.textContent = "No preview data found";
    return;
  }

  // Update page title
  document.title = `${data.previewTitle || "Slides"} - Article Deck`;

  // Create iframe with the HTML content
  const iframe = document.createElement("iframe");
  iframe.srcdoc = data.previewHtml;
  iframe.style.width = "100%";
  iframe.style.height = "calc(100vh - 120px)";
  iframe.style.border = "none";
  iframe.style.background = "white";

  loading.remove();
  container.appendChild(iframe);

  // Clean up storage
  await chrome.storage.local.remove(["previewHtml", "previewTitle"]);
}

printBtn.addEventListener("click", () => {
  const iframe = container.querySelector("iframe");
  if (iframe?.contentWindow) {
    iframe.contentWindow.print();
  }
});

closeBtn.addEventListener("click", () => {
  window.close();
});

init();
