import { buildExtension } from "@chex/build-utils";

await buildExtension({
  root: import.meta.dir.replace("/scripts", ""),
  entrypoints: {
    type: "static",
    entries: [
      { entry: "src/content.ts", outdir: ".", outfile: "content.js" },
      { entry: "src/background.ts", outdir: ".", outfile: "background.js" },
      { entry: "src/sidepanel/main.tsx", outdir: "sidepanel" },
    ],
  },
  htmlFiles: [{ src: "src/sidepanel/index.html", dest: "sidepanel/index.html" }],
  css: {
    type: "tailwind",
    input: "src/sidepanel/index.css",
    output: "sidepanel/main.css",
  },
});
