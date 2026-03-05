import { formatConversation } from "./formatter.ts";
import type { SaveRequest, SaveResponse } from "./types.ts";
import { writeConversation } from "./writer.ts";

const vaultPath = process.env.SHELF_VAULT_PATH;
if (!vaultPath) {
  console.error("SHELF_VAULT_PATH environment variable is required");
  process.exit(1);
}

const port = Number(process.env.SHELF_PORT) || 18234;

function now(): string {
  return (
    new Date().toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }).replace(" ", "T") + "+09:00"
  );
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const server = Bun.serve({
  port,
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ status: "ok" });
    }

    if (req.method === "POST" && url.pathname === "/save") {
      const body = (await req.json()) as Partial<SaveRequest>;
      const data = body.data;

      if (!data?.source || !data.conversationId || !data.messages) {
        return jsonResponse(
          {
            success: false,
            error: "Missing required fields: data.source, data.conversationId, data.messages",
          } satisfies SaveResponse,
          400,
        );
      }

      const markdown = formatConversation(data, now());
      const filePath = writeConversation(vaultPath, data.source, data.conversationId, markdown);

      return jsonResponse({ success: true, filePath } satisfies SaveResponse);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
});

console.log(`distill-server listening on http://localhost:${server.port}`);
console.log(`Vault path: ${vaultPath}`);
