# @chex/distill

## 0.4.0

### Minor Changes

- ### Features
  - Add claude.ai conversation saving support

## 0.3.0

### Minor Changes

- ### Features
  - Add Grok conversation saving support
  - Auto-save on page load and tab activation

  ### Improvements
  - Skip redundant writes via server-side content comparison (saved_at only differs → no overwrite)
  - Capture streamed responses during auto-save
  - Record precise JST datetime on save

  ### Internal
  - Simplify content script architecture (unified SiteAdapter pattern)
  - Remove unused fnv1a export, use fingerprintElements directly

## 0.2.0

### Minor Changes

- ### Features
  - Save ChatGPT conversations to Obsidian vault as Markdown via local server
  - Auto-save on conversation update with MutationObserver
  - Manual save via extension icon click
  - YAML frontmatter with source, URL, model, date, and title
  - Markdown formatting with role labels and horizontal rules between turns
  - Collapse consecutive blank lines and tighten list items

  ### Internal
  - Formatting logic runs on server side for easier iteration without extension reload
