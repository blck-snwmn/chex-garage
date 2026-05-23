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

### Tooling

CLI tools (`lefthook`) are managed by [aqua](https://aquaproj.github.io/) with versions pinned in [aqua.yaml](aqua.yaml).

Install aqua itself first (see the [aqua installation guide](https://aquaproj.github.io/docs/install)), then install the pinned tools:

```
aqua install
```

[lefthook](lefthook.yml) runs lint and format checks on staged files before each commit. Register the hooks once after cloning:

```
lefthook install
```
