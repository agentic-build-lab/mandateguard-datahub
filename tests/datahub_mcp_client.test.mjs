import assert from "node:assert/strict";
import test from "node:test";
import { DataHubMcpClient } from "../services/control_api/datahub_mcp_client.mjs";

test("MCP client initializes once, sends initialized notification, and lists tools", async () => {
  const requests = [];
  const responses = [
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        result: { protocolVersion: "2025-03-26" }
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "mcp-session-id": "session-123"
        }
      }
    ),
    new Response(null, { status: 202 }),
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        result: { tools: [{ name: "search" }] }
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    ),
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        result: { content: [{ type: "text", text: "{}" }] }
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  ];
  const client = new DataHubMcpClient({
    url: "https://datahub.example/mcp",
    token: "secret",
    fetchImpl: async (_url, init) => {
      requests.push({
        headers: init.headers,
        body: JSON.parse(init.body)
      });
      return responses.shift();
    }
  });

  const listed = await client.listTools();
  await client.callTool("search", { query: "/q finance+payments" });

  assert.deepEqual(listed, { tools: [{ name: "search" }] });
  assert.deepEqual(
    requests.map((request) => request.body.method),
    ["initialize", "notifications/initialized", "tools/list", "tools/call"]
  );
  assert.equal(requests[0].headers.Authorization, "Bearer secret");
  assert.equal(requests[1].headers["Mcp-Session-Id"], "session-123");
  assert.equal(requests[3].headers["Mcp-Session-Id"], "session-123");
  assert.equal(requests[1].body.id, undefined);
  assert.equal(requests[1].body.params, undefined);
  assert.equal(requests[2].body.params, undefined);
});
