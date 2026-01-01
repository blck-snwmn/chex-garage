import { buildExtension } from "@chex/build-utils";

await buildExtension({
  root: import.meta.dir.replace("/scripts", ""),
  entrypoints: {
    type: "static",
    entries: [
      { entry: "src/background.ts", outdir: "background" },
      { entry: "src/content.ts", outdir: "content" },
      { entry: "src/popup/index.ts", outdir: "popup" },
      { entry: "src/options/index.ts", outdir: "options" },
      { entry: "src/preview/index.ts", outdir: "preview" },
    ],
  },
  htmlFiles: [
    { src: "src/popup/index.html", dest: "popup/index.html" },
    { src: "src/options/index.html", dest: "options/index.html" },
    { src: "src/preview/index.html", dest: "preview/index.html" },
  ],
  css: {
    type: "copy",
    files: [
      { src: "src/popup/style.css", dest: "popup/style.css" },
      { src: "src/options/style.css", dest: "options/style.css" },
      { src: "src/preview/style.css", dest: "preview/style.css" },
    ],
  },
});
