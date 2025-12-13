console.log("Graft: Gemini script loaded");

// Extract Conversation ID
function extractConversationId(element: Element): string | null {
  const jslog = element.getAttribute("jslog");
  if (!jslog) return null;
  
  // jslog="...;BardVeMetadataKey:[...,[&quot;c_637dd0c444724b12&quot;,null,0]];..."
  // ID is c_ + 16 hex characters
  const match = jslog.match(/c_([a-f0-9]{16})/);
  // Return the capture group (ID part only) as URL doesn't include 'c_' prefix
  return match && match[1] ? match[1] : null;
}

// Inject global styles
// Adjust styles to prevent overlap between conversation title and action button
function injectGlobalStyles() {
  if (document.getElementById('graft-global-styles')) return;

  const style = document.createElement('style');
  style.id = 'graft-global-styles';
  style.textContent = `
    /* Add padding to the right of conversation title to prevent overlap with the action button */
    .conversation-title {
      padding-right: 40px !important; 
    }

    /* Button styles */
    .graft-open-tab-button {
      background: transparent;
      border: none;
      cursor: pointer;
      width: 30px;
      height: 30px;
      margin-right: 0px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit; /* Inherit parent text color for dark mode support */
      opacity: 0; /* Hidden by default */
      transition: background-color 0.2s, opacity 0.2s;
    }
    
    /* Background color on hover */
    .graft-open-tab-button:hover {
      background-color: rgba(128, 128, 128, 0.2);
      opacity: 1 !important;
    }
    
    /* Show button when hovering over the parent element (conversation row) */
    div[data-test-id="conversation"]:hover .graft-open-tab-button,
    .conversation-actions-container:hover .graft-open-tab-button {
      opacity: 0.7;
      visibility: visible;
      z-index: 10; /* Ensure it's not hidden behind other elements */
    }
  `;
  document.head.appendChild(style);
}

// Process each conversation item and add the button
function processConversationItem(element: Element) {
  // Get conversation ID
  const conversationId = extractConversationId(element);
  if (!conversationId) return;

  // Find the action container
  // It might be a sibling of the parent or inside the element
  // element itself is <div data-test-id="conversation">
  
  // Structure 1: Container is a sibling (as seen in reference.html)
  // <div class="conversation-items-container">
  //   <div data-test-id="conversation">...</div>
  //   <div class="conversation-actions-container">...</div>
  // </div>
  let actionsContainer = element.parentElement?.querySelector('.conversation-actions-container');
  
  // Structure 2: Container is inside the element (fallback)
  if (!actionsContainer) {
    actionsContainer = element.querySelector('.conversation-actions-container');
  }

  if (!actionsContainer) return;

  // Check if button already exists (prevent duplicates)
  if (actionsContainer.querySelector('.graft-open-tab-button')) {
    return;
  }

  // Find the menu button (three dots)
  const menuButton = actionsContainer.querySelector('.conversation-actions-menu-button') || actionsContainer.querySelector('button');
  
  // Create button
  const openButton = document.createElement('button');
  openButton.className = 'graft-open-tab-button';
  openButton.title = 'Open in new tab';
  
  // SVG Icon
  openButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/>
    </svg>
  `;

  // Click event
  openButton.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `https://gemini.google.com/app/${conversationId}`;
    window.open(url, '_blank');
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
const observer = new MutationObserver((mutations) => {
  // Execute scan on any change (could be throttled, but simple enough for now)
  scanAndProcess();
});

// Initialization
function init() {
  console.log("Graft: Initializing...");
  
  injectGlobalStyles(); // Inject styles
  
  // Initial scan
  scanAndProcess();

  // Start observing DOM
  observer.observe(document.body, { childList: true, subtree: true });

  // Fallback: Periodic polling (for cases missed by DOM observation or large re-renders)
  setInterval(scanAndProcess, 2000);
}

// Execution
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}