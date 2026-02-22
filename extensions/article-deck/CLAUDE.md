# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Article Deck is a Chrome extension that generates Marp slides from web page content. Features:

- Extract article content from web pages using Readability
- Convert HTML to Markdown with Turndown
- Summarize content using Chrome built-in Summarizer API (Gemini Nano)
- Generate presentation slides using Chrome built-in Prompt API (Gemini Nano)
- Preview slides with Marp rendering

## Architecture

### Extension Structure

```
src/
├── background.ts      # Background service worker
├── content.ts         # Content script for page extraction
├── extractor.ts       # Article extraction (Readability + Turndown)
├── nano.ts            # Chrome built-in AI integration (Summarizer + Prompt API)
├── chrome-ai.d.ts     # Type declarations for Chrome built-in AI APIs
├── marp.ts            # Marp slide generation
├── types.ts           # Shared type definitions
├── popup/             # Popup UI
└── preview/           # Slide preview page
manifest.json          # Chrome extension manifest (V3)
```

### AI Processing Pipeline

1. **Summarizer API** - Summarizes article content into key points (markdown format)
2. **Prompt API** - Converts summarized content into Marp-format presentation slides

Requires Chrome 138+ with compatible hardware (22GB free storage, GPU 4GB+ VRAM or CPU 16GB RAM).
