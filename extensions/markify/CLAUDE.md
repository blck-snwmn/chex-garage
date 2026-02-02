# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Markify is a Chrome extension that extracts page content and converts it to Markdown format.

Features:

- Extract main content using Readability.js
- Convert HTML to Markdown with Turndown (GFM support)
- One-click operation: click extension icon to copy to clipboard AND download as .md file
- No UI - runs silently, only shows notification on error

## Architecture

### Extension Structure

```
src/
├── types.ts              # Type definitions (ExtractedContent, ExtractResult)
├── extractor.ts          # Core extraction logic (Readability + Turndown)
├── extractor.test.ts     # Unit tests
├── turndown-plugin-gfm.d.ts  # Type declarations for GFM plugin
└── background.ts         # Service worker (handles click, extract, copy, download)
```

### How It Works

1. User clicks the extension icon
2. Background service worker runs immediately (no popup)
3. Uses `chrome.scripting.executeScript` to get page HTML
4. Parses HTML with Readability.js to extract main content
5. Converts extracted HTML to Markdown with Turndown
6. Downloads as `.md` file via `chrome.downloads`
7. Copies to clipboard via content script injection
8. On error, shows notification via `chrome.notifications`

### Key Dependencies

- `@mozilla/readability`: Extracts main article content from web pages
- `turndown`: Converts HTML to Markdown
- `turndown-plugin-gfm`: Adds GitHub Flavored Markdown support (tables, strikethrough, task lists)

### No Popup

This extension runs entirely in the background - clicking the icon triggers immediate action with no UI.
