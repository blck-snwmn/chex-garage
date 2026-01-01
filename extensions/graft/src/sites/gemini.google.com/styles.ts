export const STYLE_ID = "graft-global-styles";

export const GLOBAL_STYLES = `
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

export const OPEN_TAB_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/>
</svg>
`;
