import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";

const env = {
  ASSETS: {
    fetch: async () => new Response("asset", { status: 200 })
  }
};

test("Sites worker runs and approves the public demo workflow", async () => {
  const runResponse = await worker.fetch(
    new Request("https://example.test/api/run", { method: "POST" }),
    env
  );
  const running = await runResponse.json();
  assert.equal(running.summary.activeIncidents, 1);
  assert.equal(running.summary.exposure, 48270);

  const approveResponse = await worker.fetch(
    new Request("https://example.test/api/approve", { method: "POST" }),
    env
  );
  const resolved = await approveResponse.json();
  assert.equal(resolved.summary.activeIncidents, 0);
  assert.equal(resolved.summary.exposure, 0);
  assert.equal(resolved.writeBack.descriptionAppended, false);
  assert.equal(resolved.writeBack.auditDocumentSaved, false);
  assert.equal(resolved.writeBack.simulationReceipts, 3);
  assert.match(
    resolved.timeline.at(-1).detail,
    /no DataHub tenant was changed/
  );
});

test("Sites worker delegates non-API requests to static assets", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/"),
    env
  );
  assert.equal(await response.text(), "asset");
});

test("Sites worker falls back to index.html for client routes", async () => {
  const requestedPaths = [];
  const fallbackEnv = {
    ASSETS: {
      fetch: async (request) => {
        const path = new URL(request.url).pathname;
        requestedPaths.push(path);
        return path === "/index.html"
          ? new Response("app shell", { status: 200 })
          : new Response("missing", { status: 404 });
      }
    }
  };

  const response = await worker.fetch(
    new Request("https://example.test/incidents/MG-204"),
    fallbackEnv
  );

  assert.deepEqual(requestedPaths, ["/incidents/MG-204", "/index.html"]);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "app shell");
});
