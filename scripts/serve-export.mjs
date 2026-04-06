import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "out");
const host = "127.0.0.1";
const port = Number(process.argv[2] ?? process.env.PORT ?? 3000);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"]
]);

function safeJoin(rootPath, requestedPath) {
  const resolvedPath = path.resolve(rootPath, `.${requestedPath}`);

  if (!resolvedPath.startsWith(rootPath)) {
    return null;
  }

  return resolvedPath;
}

function resolveCandidateFiles(requestPath) {
  if (requestPath === "/") {
    return [path.join(root, "index.html")];
  }

  const safePath = safeJoin(root, requestPath);

  if (!safePath) {
    return [];
  }

  return [
    safePath,
    `${safePath}.html`,
    path.join(safePath, "index.html")
  ];
}

async function resolveFile(requestPath) {
  for (const candidate of resolveCandidateFiles(requestPath)) {
    if (!candidate || !existsSync(candidate)) {
      continue;
    }

    const candidateStat = await stat(candidate);

    if (candidateStat.isFile()) {
      return candidate;
    }
  }

  const fallback404 = path.join(root, "404.html");
  return existsSync(fallback404) ? fallback404 : null;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);
    const filePath = await resolveFile(url.pathname);

    if (!filePath) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const statusCode = filePath.endsWith("404.html") ? 404 : 200;

    response.writeHead(statusCode, {
      "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=3600"
    });

    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Unexpected server error");
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Serving exported site from ${root} at http://${host}:${port}\n`);
});