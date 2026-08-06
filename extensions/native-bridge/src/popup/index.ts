const form = document.querySelector("form");
const input = document.querySelector("input");
const status = document.querySelector("p");

if (!form || !input || !status) {
  throw new Error("Popup elements are missing");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = (await chrome.runtime.sendMessage({ text: input.value })) as {
    ok: boolean;
    error?: string;
  };
  status.textContent = response.ok ? "Sent" : (response.error ?? "Failed to send");
  if (response.ok) {
    input.value = "";
  }
});
