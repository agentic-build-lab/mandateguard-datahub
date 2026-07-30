const JSON_RPC_VERSION = "2.0";

function parseMcpPayload(contentType, body) {
  if (contentType.includes("application/json")) {
    return JSON.parse(body);
  }
  const dataLine = body
    .split(/\r?\n/)
    .find((line) => line.startsWith("data:"));
  if (!dataLine) {
    throw new Error("DataHub MCP returned an unsupported response");
  }
  return JSON.parse(dataLine.slice(5).trim());
}

export class DataHubMcpClient {
  constructor({ url, token, fetchImpl = fetch }) {
    this.url = url;
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.requestId = 0;
    this.sessionId = null;
  }

  async request(method, params = {}) {
    const headers = {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json"
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;

    const response = await this.fetchImpl(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: JSON_RPC_VERSION,
        id: ++this.requestId,
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`DataHub MCP ${method} failed with ${response.status}`);
    }
    this.sessionId = response.headers.get("mcp-session-id") || this.sessionId;
    const payload = parseMcpPayload(
      response.headers.get("content-type") || "",
      await response.text()
    );
    if (payload.error) throw new Error(payload.error.message || "DataHub MCP error");
    return payload.result;
  }

  async initialize() {
    return this.request("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "mandateguard", version: "0.1.0" }
    });
  }

  async callTool(name, args) {
    if (!this.sessionId) await this.initialize();
    return this.request("tools/call", { name, arguments: args });
  }
}
