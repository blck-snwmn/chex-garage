# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Article Deck is a Chrome extension that generates Marp slides from web page content. Features:

- Extract article content from web pages using Readability
- Convert HTML to Markdown with Turndown
- Generate presentation slides using Gemini AI
- Preview slides with Marp rendering

## Architecture

### Extension Structure

```
src/
├── background.ts      # Background service worker
├── content.ts         # Content script for page extraction
├── extractor.ts       # Article extraction (Readability + Turndown)
├── gemini.ts          # Gemini AI integration
├── marp.ts            # Marp slide generation
├── storage.ts         # Chrome Storage API wrapper
├── types.ts           # Shared type definitions
├── popup/             # Popup UI
├── options/           # Options page (API key settings)
└── preview/           # Slide preview page
manifest.json          # Chrome extension manifest (V3)
```
