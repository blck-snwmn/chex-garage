# CLAUDE.md

This file provides guidance to Claude Code when working with code in this extension.

## Project Overview

Distill is a Chrome extension that saves AI conversations (ChatGPT, etc.) to an Obsidian vault as Markdown files via a local HTTP server.

## Architecture

```
[ChatGPT page]
  └─ content script (MutationObserver + manual trigger)
       └─ chrome.runtime.sendMessage → background service worker
            └─ formatter.ts で Markdown生成
                 └─ fetch POST http://localhost:18234/save
                      └─ distill-server がファイル書き込み
                           └─ {vault}/ai-conversations/chatgpt/{id}.md
```

### Extension Structure

```
src/
├── types.ts                    # Message型, ConversationData型, API型
├── formatter.ts                # ConversationData → Markdown (pure function)
├── formatter.test.ts
├── client.ts                   # distill-server HTTPクライアント
├── background.ts               # action.onClicked + message routing
└── sites/
    └── chatgpt.com/
        └── index.ts            # DOM抽出, MutationObserver, auto-save
```

### Server (packages/distill-server)

- `Bun.serve()` on `localhost:18234`
- `POST /save` — Markdownファイルをvaultに書き込み
- `GET /health` — ヘルスチェック
- 環境変数: `SHELF_VAULT_PATH`（必須）, `SHELF_PORT`（デフォルト18234）

## Supported Sites

| Site        | DOM Selectors                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------- |
| chatgpt.com | `[data-message-author-role]` for messages, `[data-testid='model-selector-trigger']` for model |

## Running the Server

```bash
cd packages/distill-server
SHELF_VAULT_PATH=/path/to/obsidian/vault bun run start
```

## Adding New Sites

1. Add content_scripts entry in `manifest.json`
2. Add host_permissions
3. Add entrypoint in `scripts/build.ts`
4. Create `src/sites/<domain>/index.ts`
