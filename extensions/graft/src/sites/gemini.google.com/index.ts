import { buildConversationUrl, extractConversationId } from "./conversation";
import { GLOBAL_STYLES, OPEN_TAB_ICON_SVG, STYLE_ID } from "./styles";
import { formatTabTitle } from "./tab-title";

console.log("Graft: Gemini script loaded");

// Update browser tab title based on current chat title
function updateBrowserTabTitle() {
  const titleElement = document.querySelector("span.conversation-title");
  const chatTitle = titleElement?.textContent;
  document.title = formatTabTitle(chatTitle);
}

// Inject global styles
function injectGlobalStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = GLOBAL_STYLES;
  document.head.appendChild(style);
}

// Process each conversation item and add the button
function processConversationItem(element: Element) {
  // Get conversation ID from jslog attribute
  const jslog = element.getAttribute("jslog");
  const conversationId = extractConversationId(jslog);
  if (!conversationId) return;

  // Find the action container
  // Structure 1: Container is a sibling
  let actionsContainer = element.parentElement?.querySelector(".conversation-actions-container");

  // Structure 2: Container is inside the element (fallback)
  if (!actionsContainer) {
    actionsContainer = element.querySelector(".conversation-actions-container");
  }

  if (!actionsContainer) return;

  // Check if button already exists (prevent duplicates)
  if (actionsContainer.querySelector(".graft-open-tab-button")) {
    return;
  }

  // Find the menu button (three dots)
  const menuButton =
    actionsContainer.querySelector(".conversation-actions-menu-button") ||
    actionsContainer.querySelector("button");

  // Create button
  const openButton = document.createElement("button");
  openButton.className = "graft-open-tab-button";
  openButton.title = "Open in new tab";
  openButton.innerHTML = OPEN_TAB_ICON_SVG;

  // Click event
  openButton.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    const url = buildConversationUrl(conversationId);
    window.open(url, "_blank");
  });

  // Insert position
  if (menuButton) {
    actionsContainer.insertBefore(openButton, menuButton);
  } else {
    actionsContainer.insertBefore(openButton, actionsContainer.firstChild);
  }
}

// Scan and process all items
function scanAndProcess() {
  const items = document.querySelectorAll('div[data-test-id="conversation"]');
  items.forEach(processConversationItem);
}

// MutationObserver setup
const observer = new MutationObserver(() => {
  scanAndProcess();
  updateBrowserTabTitle();
});

// Initialization
function init() {
  console.log("Graft: Initializing...");

  injectGlobalStyles();
  scanAndProcess();
  updateBrowserTabTitle();

  // Start observing DOM
  observer.observe(document.body, { childList: true, subtree: true });

  // Fallback: Periodic polling
  setInterval(scanAndProcess, 2000);
}

// Execution
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
