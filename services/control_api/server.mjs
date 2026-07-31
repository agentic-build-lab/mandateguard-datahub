import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  approveReconciliation,
  createControlState,
  runControl
} from "./control_engine.mjs";
import { createGateway } from "./datahub_gateway.mjs";

const projectRoot = normalize(join(fileURLToPath(new URL(".", import.meta.url)), "../.."));
const distRoot = join(projectRoot, "dist");
const port = Number(process.env.PORT || 8787);
let state = createControlState();
let gateway = createGateway();

const contentTypes = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function json(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

async function serveStatic(request, response) {
  const rawPath = new URL(request.url, "http://localhost").pathname;
  const requestPath = rawPath === "/" ? "/index.html" : rawPath;
  let filePath = normalize(join(distRoot, requestPath));
  if (!filePath.startsWith(distRoot)) return json(response, 403, { error: "forbidden" });

  try {
    if (!(await stat(filePath)).isFile()) throw new Error("not a file");
  } catch {
    filePath = join(distRoot, "index.html");
  }
  const body = await readFile(filePath);
  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream"
  });
  response.end(body);
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === "/api/state" && request.method === "GET") {
      return json(response, 200, state);
    }
    if (request.url === "/api/run" && request.method === "POST") {
      gateway = createGateway();
      state = await runControl(gateway);
      return json(response, 200, state);
    }
    if (request.url === "/api/approve" && request.method === "POST") {
      state = await approveReconciliation(state, gateway);
      return json(response, 200, state);
    }
    if (request.url === "/api/health" && request.method === "GET") {
      return json(response, 200, { ok: true, mode: state.mode });
    }
    return serveStatic(request, response);
  } catch (error) {
    return json(response, 500, {
      error: error instanceof Error ? error.message : "unknown error"
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`MandateGuard control API listening on http://127.0.0.1:${port}`);
});
