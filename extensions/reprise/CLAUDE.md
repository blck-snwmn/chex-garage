# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reprise is a Chrome extension for YouTube video loop control. Features:

- Set custom start/end times to loop a specific section of YouTube videos
- Side Panel UI for configuration (start time, end time, loop name)
- Manage multiple loops per video with easy activation/deactivation
- Persistent storage: loop settings are saved and restored across sessions

### Specifications

- **Time format**: `m:ss` or `h:mm:ss` (e.g., `1:26`, `4:42`, `1:23:45`)
- **Validation**: Required (start < end, within video duration)
- **Persistence**: Loops are saved per video using Chrome Storage API
- **Loop mechanism**: Uses `timeupdate` event to check `currentTime` and seek back to start

## Coding Rules

### content.ts: video variable handling

Always use `setVideo()` when assigning to the `video` variable.

```typescript
// ❌ NG: Direct assignment won't attach timeupdate listener
video = findVideo();

// ✅ OK: Use setVideo (manages listener attach/detach)
setVideo(findVideo());
```

`setVideo()` removes the listener from the old video and attaches it to the new one. Direct assignment skips this, breaking the loop functionality.

## Architecture

### Extension Structure

```
src/
├── content.ts         # Content script injected into YouTube pages
├── background.ts      # Background service worker (Side Panel management)
├── storage.ts         # Chrome Storage API wrapper
├── types.ts           # Shared type definitions
├── utils.ts           # Utility functions
└── sidepanel/         # Side Panel UI (React)
    ├── index.html
    ├── main.tsx
    ├── App.tsx
    └── components/
        ├── LoopList.tsx    # Loop list display
        ├── LoopItem.tsx    # Individual loop item
        ├── LoopEditor.tsx  # Loop create/edit form
        └── TimeInput.tsx   # Time input with slider
manifest.json          # Chrome extension manifest (V3)
```

### Communication Flow

```
Side Panel <---> Content Script (YouTube page)
     |                    |
     +---> Storage <------+
```

State is persisted using Chrome Storage API. The content script restores loop state when video changes.
