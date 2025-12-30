import { getApiKey, setApiKey } from "../lib/storage.ts";

const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const toggleBtn = document.getElementById("toggleBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

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

init();
