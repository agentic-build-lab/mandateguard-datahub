import { DataHubMcpClient } from "./datahub_mcp_client.mjs";

export class FixtureDataHubGateway {
  constructor() {
    this.events = [];
  }

  async addTags(urn, tags) {
    this.events.push({ tool: "add_tags", urn, tags });
  }

  async updateDescription(urn, description) {
    this.events.push({ tool: "update_description", urn, description });
  }

  async saveAuditDocument(document) {
    this.events.push({ tool: "save_document", document });
  }
}

export class RemoteDataHubGateway {
  constructor({ url, token, mutationsEnabled }) {
    this.client = new DataHubMcpClient({ url, token });
    this.mutationsEnabled = mutationsEnabled;
  }

  assertMutationsEnabled() {
    if (!this.mutationsEnabled) {
      throw new Error(
        "DATAHUB_MUTATIONS_ENABLED must be true before catalog write-back"
      );
    }
  }

  async addTags(urn, tags) {
    this.assertMutationsEnabled();
    return this.client.callTool("add_tags", {
      urns: [urn],
      tags
    });
  }

  async updateDescription(urn, description) {
    this.assertMutationsEnabled();
    return this.client.callTool("update_description", {
      urn,
      description,
      mode: "APPEND"
    });
  }

  async saveAuditDocument(document) {
    this.assertMutationsEnabled();
    return this.client.callTool("save_document", {
      title: `MandateGuard audit ${document.id}`,
      content: JSON.stringify(document, null, 2),
      format: "markdown"
    });
  }
}

export function createGateway() {
  if (!process.env.DATAHUB_MCP_URL) {
    return new FixtureDataHubGateway();
  }
  return new RemoteDataHubGateway({
    url: process.env.DATAHUB_MCP_URL,
    token: process.env.DATAHUB_TOKEN,
    mutationsEnabled: process.env.DATAHUB_MUTATIONS_ENABLED === "true"
  });
}
