import { buildExtension } from "@chex/build-utils";

await buildExtension({
  root: import.meta.dir.replace("/scripts", ""),
  entrypoints: {
    type: "static",
    entries: [
      { entry: "src/background.ts", outdir: ".", outfile: "background.js" },
      {
        entry: "src/sites/chatgpt.com/index.ts",
        outdir: "sites/chatgpt.com",
        outfile: "index.js",
      },
      {
        entry: "src/sites/grok.com/index.ts",
        outdir: "sites/grok.com",
        outfile: "index.js",
      },
      {
        entry: "src/sites/claude.ai/index.ts",
        outdir: "sites/claude.ai",
        outfile: "index.js",
      },
    ],
  },
});
