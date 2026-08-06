import { buildExtension } from "@chex/build-utils";

await buildExtension({
  root: import.meta.dir.replace("/scripts", ""),
  entrypoints: {
    type: "static",
    entries: [
      { entry: "src/background.ts", outdir: "background" },
      { entry: "src/popup/index.ts", outdir: "popup" },
    ],
  },
  htmlFiles: [{ src: "src/popup/index.html", dest: "popup/index.html" }],
});
