import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outdir = resolve("dist");
mkdirSync(outdir, { recursive: true });

await build({
  entryPoints: [resolve("src/server.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: resolve(outdir, "server.js"),
  sourcemap: true,
  target: "node20",
  packages: "external",
  logLevel: "info"
});
