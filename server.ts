import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createDiscordApi } from "./server/api.ts";

const root = fileURLToPath(new URL("./dist", import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const appOrigin = process.env.APP_ORIGIN ?? `http://localhost:${port}`;
const api = createDiscordApi({
  appOrigin,
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: process.env.DISCORD_REDIRECT_URI ?? `${appOrigin}/api/auth/callback`,
});

const contentTypes: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const serveStatic = async (request: IncomingMessage, response: ServerResponse) => {
  const requestUrl = new URL(request.url ?? "/", appOrigin);
  const requestedPath = requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname;
  const relativePath = normalize(requestedPath).replace(/^[/\\]+/, "");
  let filePath = join(root, relativePath);
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
  } catch {
    filePath = join(root, "index.html");
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
    "Content-Security-Policy":
      "default-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' https://discord.com",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(filePath).pipe(response);
};

const server = createServer((request, response) => {
  void api(request, response, () => void serveStatic(request, response));
});

server.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, () => {
  console.log(`Guild Exporter: ${appOrigin}`);
});
