import { build } from "esbuild";
import { createServer } from "node:http";
import { readFileSync, mkdirSync, writeFileSync, existsSync, createReadStream } from "node:fs";
import { extname, join, resolve, dirname } from "node:path";
import { createRequire } from "node:module";

const [, , appDirArg, portArg] = process.argv;

if (!appDirArg) {
  console.error("Usage: node scripts/serve-react-app.mjs <app-dir> [port]");
  process.exit(1);
}

const appDir = resolve(appDirArg);
const port = Number(portArg ?? "5173");
const outdir = join(appDir, ".dev-dist");
const entry = join(appDir, "src/main.tsx");
const apiBaseUrl = process.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const repoRequire = createRequire(resolve("package.json"));

function resolveImport(importPath, resolveDir) {
  if (importPath.startsWith(".") || importPath.startsWith("/")) {
    const base = resolve(resolveDir, importPath);
    const candidates = [
      base,
      `${base}.tsx`,
      `${base}.ts`,
      `${base}.jsx`,
      `${base}.js`,
      `${base}.css`,
      join(base, "index.tsx"),
      join(base, "index.ts"),
      join(base, "index.jsx"),
      join(base, "index.js"),
      join(base, "index.css")
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return repoRequire.resolve(base);
  }

  return repoRequire.resolve(importPath);
}

mkdirSync(outdir, { recursive: true });

const result = await build({
  stdin: {
    contents: readFileSync(entry, "utf8"),
    resolveDir: dirname(entry),
    sourcefile: entry,
    loader: "tsx"
  },
  bundle: true,
  format: "esm",
  platform: "browser",
  outdir,
  write: false,
  sourcemap: true,
  jsx: "automatic",
  loader: {
    ".css": "css",
    ".svg": "file",
    ".png": "file",
    ".jpg": "file",
    ".jpeg": "file",
    ".webp": "file"
  },
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBaseUrl)
  },
  plugins: [
    {
      name: "local-resolver",
      setup(buildApi) {
        buildApi.onResolve({ filter: /.*/ }, (args) => {
          if (args.path.startsWith("http://") || args.path.startsWith("https://") || args.path.startsWith("data:")) {
            return { external: true };
          }

          return { path: resolveImport(args.path, args.resolveDir) };
        });
      }
    }
  ]
});

for (const file of result.outputFiles) {
  const relativePath = file.path.replaceAll("\\", "/").split("/").slice(-1)[0];
  const fullPath = join(outdir, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, file.contents);
}

const jsFile = result.outputFiles.find((file) => file.path.endsWith(".js"));
const cssFile = result.outputFiles.find((file) => file.path.endsWith(".css"));

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appDir.endsWith("admin") ? "Church Admin" : "Church Platform"}</title>
    ${cssFile ? `<link rel="stylesheet" href="/${cssFile.path.split(/[\\/]/).pop()}" />` : ""}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${jsFile.path.split(/[\\/]/).pop()}"></script>
  </body>
</html>`;

writeFileSync(join(outdir, "index.html"), html);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

createServer((req, res) => {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = join(outdir, pathname);
  const resolved = resolve(filePath);
  if (!resolved.startsWith(resolve(outdir))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const serveFile = (path) => {
    const ext = extname(path);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] ?? "application/octet-stream" });
    createReadStream(path).pipe(res);
  };

  if (existsSync(filePath)) {
    serveFile(filePath);
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(readFileSync(join(outdir, "index.html"), "utf8"));
}).listen(port, () => {
  console.log(`Serving ${appDir} on http://localhost:${port}`);
});
