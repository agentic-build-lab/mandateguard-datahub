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
    this.initialized = false;
  }

  headers() {
    const headers = {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json"
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
    return headers;
  }

  async request(method, params) {
    const body = {
      jsonrpc: JSON_RPC_VERSION,
      id: ++this.requestId,
      method
    };
    if (params !== undefined) body.params = params;
    const response = await this.fetchImpl(this.url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body)
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

  async notify(method, params) {
    const body = {
      jsonrpc: JSON_RPC_VERSION,
      method
    };
    if (params !== undefined) body.params = params;
    const response = await this.fetchImpl(this.url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`DataHub MCP ${method} failed with ${response.status}`);
    }
  }

  async initialize() {
    const result = await this.request("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "mandateguard", version: "0.1.0" }
    });
    await this.notify("notifications/initialized");
    this.initialized = true;
    return result;
  }

  async listTools() {
    if (!this.initialized) await this.initialize();
    return this.request("tools/list");
  }

  async callTool(name, args) {
    if (!this.initialized) await this.initialize();
    return this.request("tools/call", { name, arguments: args });
  }
}
