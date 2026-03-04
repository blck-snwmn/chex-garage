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
    ],
  },
});
