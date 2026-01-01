# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Graft is a personal UserScript manager Chrome extension. Features:

- Site-specific content scripts with custom functionality
- Modular architecture for adding new site support

### Supported Sites

- `gemini.google.com` - Custom styles and tab title management

## Architecture

### Extension Structure

```
src/
└── sites/                        # Site-specific scripts
    └── gemini.google.com/
        ├── index.ts              # Entry point
        ├── styles.ts             # Custom styles
        ├── tab-title.ts          # Tab title management
        ├── conversation.ts       # Conversation handling
        └── *.test.ts             # Tests
manifest.json                     # Chrome extension manifest (V3)
```

### Adding New Site Support

1. Create a new directory under `src/sites/<domain>/`
2. Add an `index.ts` entry point
3. Register the content script in `manifest.json`
