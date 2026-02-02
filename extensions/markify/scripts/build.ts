import { buildExtension } from "@chex/build-utils";

await buildExtension({
  root: import.meta.dir.replace("/scripts", ""),
  entrypoints: {
    type: "static",
    entries: [
      { entry: "src/background.ts", outdir: ".", outfile: "background.js" },
      { entry: "src/content.ts", outdir: ".", outfile: "content.js" },
    ],
  },
});
