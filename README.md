# chex-garage

A Bun-based monorepo for Chrome extensions (Manifest V3).

## Extensions

- [Reprise](extensions/reprise/) - YouTube video loop control with custom start/end times
- [Article Deck](extensions/article-deck/) - Generate slides from page content
- [Graft](extensions/graft/) - Personal UserScript manager

## Build

```bash
bun install
bun run build
```

## Development

```bash
bun run test
bun run lint
bun run fmt
```
