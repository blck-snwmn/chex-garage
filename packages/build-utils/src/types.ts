/** Static entry point configuration */
export interface StaticEntry {
  /** Source file path (relative to ROOT) */
  entry: string;
  /** Output directory (relative to dist) */
  outdir: string;
  /** Output filename (default: index.js) */
  outfile?: string;
}

/** Entry point configuration - static or dynamic */
export type EntryPointConfig =
  | { type: "static"; entries: StaticEntry[] }
  | { type: "dynamic"; scanDir: string; pattern?: string };

/** File copy configuration */
export interface CopyFile {
  /** Source path (relative to ROOT) */
  src: string;
  /** Destination path (relative to dist) */
  dest: string;
}

/** CSS processing configuration */
export type CssConfig =
  | { type: "none" }
  | { type: "copy"; files: CopyFile[] }
  | { type: "tailwind"; input: string; output: string };

/** Bun.build override options */
export interface BunBuildOverrides {
  minify?: boolean;
  sourcemap?: "inline" | "external" | "none";
  splitting?: boolean;
  root?: string;
  naming?: string;
}

/** Extension build configuration */
export interface ExtensionBuildConfig {
  /** Extension root directory (usually import.meta.dir) */
  root: string;

  /** Entry points configuration */
  entrypoints: EntryPointConfig;

  /** CSS processing configuration */
  css?: CssConfig;

  /** HTML files to copy */
  htmlFiles?: CopyFile[];

  /** Generate icons from SVG (default: true) */
  generateIcons?: boolean;

  /** Icon sizes to generate (default: [16, 48, 128]) */
  iconSizes?: number[];

  /** Bun.build override options */
  bunBuildOverrides?: BunBuildOverrides;

  /** Validate manifest paths (default: true) */
  validateManifest?: boolean;
}

/** Resolved entry point for building */
export interface ResolvedEntry {
  entryPath: string;
  outdir: string;
  outfile?: string;
}
