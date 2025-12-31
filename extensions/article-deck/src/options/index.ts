import { getApiKey, setApiKey } from "../storage.ts";

function getInput(id: string): HTMLInputElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLInputElement)) {
    throw new Error(`Required input #${id} not found`);
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

function getDiv(id: string): HTMLDivElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLDivElement)) {
    throw new Error(`Required div #${id} not found`);
  }
  return el;
}

const apiKeyInput = getInput("apiKey");
const saveBtn = getButton("saveBtn");
const toggleBtn = getButton("toggleBtn");
const statusEl = getDiv("status");

let isVisible = false;

async function init() {
  const apiKey = await getApiKey();
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }
}

function showStatus(message: string, type: "success" | "error") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  setTimeout(() => {
    statusEl.className = "status";
  }, 3000);
}

saveBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }

  try {
    await setApiKey(apiKey);
    showStatus("Settings saved successfully!", "success");
  } catch {
    showStatus("Failed to save settings", "error");
  }
});

toggleBtn.addEventListener("click", () => {
  isVisible = !isVisible;
  apiKeyInput.type = isVisible ? "text" : "password";
  toggleBtn.textContent = isVisible ? "Hide Key" : "Show Key";
});

void init();
