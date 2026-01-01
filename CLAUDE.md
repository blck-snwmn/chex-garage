# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

chex-garage is a Bun-based monorepo containing Chrome extensions (Manifest V3). Uses Bun workspaces with Turborepo for build orchestration.

## Commands

```bash
# Install dependencies
bun install

# Build all extensions
bun run build

# Run all tests
bun run test

# Type check (project references)
bun run typecheck

# Lint (oxlint with type-aware checking)
bun run lint
bun run lint:fix

# Format (oxfmt)
bun run fmt
bun run fmt:check

# Per-extension commands (from extension directory)
bun run build      # Build single extension
bun run test       # Run extension tests
bun run dev        # Watch mode
```

## After Code Changes

Run these commands in order after editing code:

```bash
bun run fmt        # 1. Format code
bun run lint       # 2. Lint check
bun run test       # 3. Run tests
bun run build      # 4. Verify build
```

## Architecture

```
chex-garage/
├── extensions/           # All Chrome extensions (Manifest V3)
│   ├── article-deck/   # Article processing & Marp slides (Gemini AI)
│   ├── graft/          # Image/media handling
│   └── reprise/        # YouTube loop control (React + Tailwind)
├── packages/
│   └── build-utils/    # Shared build utilities (icon generation with sharp)
└── scripts/            # Build/release scripts
```

### TypeScript Configuration

- Root `tsconfig.json` uses project references pointing to each extension
- `tsconfig.base.json` contains shared compiler options (strict mode, ESNext, bundler resolution)
- Each extension has its own `tsconfig.json` extending base

### Build System (Turborepo)

- Turborepo orchestrates builds/tests across workspaces via `turbo.json`
- Tasks: `build` (depends on upstream builds), `test` (depends on upstream builds)
- Each extension has custom `build.ts` script using Bun's bundler
- Build outputs go to `dist/` directory
- Inputs/outputs configured for caching: `src/**`, `icons/**`, `scripts/**`, `manifest.json`, `package.json` → `dist/**`

### Extension-Specific Notes

Each extension has its own `CLAUDE.md` with detailed documentation. See:

- `extensions/reprise/CLAUDE.md` - YouTube loop control
- `extensions/article-deck/CLAUDE.md` - Article to slides
- `extensions/graft/CLAUDE.md` - UserScript manager

## Tooling

- **Runtime**: Bun (prefer over Node.js)
- **Linting**: oxlint with type-aware checking (`--type-aware --type-check`)
- **Formatting**: oxfmt
- **Version management**: Changesets (`bun run version` syncs manifest.json)
