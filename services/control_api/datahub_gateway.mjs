import { DataHubMcpClient } from "./datahub_mcp_client.mjs";

const FIXTURE_ASSETS = [
  {
    urn: "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.orders,PROD)",
    name: "finance.orders",
    type: "DATASET"
  },
  {
    urn: "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.payments,PROD)",
    name: "finance.payments",
    type: "DATASET"
  },
  {
    urn: "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.settlements,PROD)",
    name: "finance.settlements",
    type: "DATASET"
  },
  {
    urn: "urn:li:dashboard:(looker,executive_revenue)",
    name: "executive_revenue",
    type: "DASHBOARD"
  }
];

function parseToolResult(result) {
  if (result?.isError) {
    const message = result.content
      ?.filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");
    throw new Error(message || "DataHub MCP tool call failed");
  }
  if (result?.structuredContent !== undefined) {
    return result.structuredContent;
  }
  const text = result?.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  }
  return result;
}

function tagUrn(tag) {
  return tag.startsWith("urn:li:tag:") ? tag : `urn:li:tag:${tag}`;
}

export class FixtureDataHubGateway {
  constructor() {
    this.mode = "fixture";
    this.events = [];
    this.reads = [];
  }

  async searchAssets(assetName) {
    this.reads.push({ tool: "search", assetName });
    const asset = FIXTURE_ASSETS.find((candidate) => candidate.name === assetName);
    return {
      searchResults: asset ? [{ entity: asset }] : []
    };
  }

  async getEntityContext(urn) {
    this.reads.push({ tool: "get_entities", urn });
    return FIXTURE_ASSETS.find((asset) => asset.urn === urn) ?? null;
  }

  async getLineage(urn, { upstream }) {
    this.reads.push({ tool: "get_lineage", urn, upstream });
    const direction = upstream ? "upstreams" : "downstreams";
    const entities = upstream
      ? [FIXTURE_ASSETS[0]]
      : FIXTURE_ASSETS.slice(2);
    return {
      [direction]: {
        searchResults: entities.map((entity, index) => ({
          entity,
          degree: index + 1
        }))
      }
    };
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
  constructor({ url, token, mutationsEnabled, client }) {
    this.mode = "connected";
    this.client = client ?? new DataHubMcpClient({ url, token });
    this.mutationsEnabled = mutationsEnabled;
    this.availableTools = null;
  }

  assertMutationsEnabled() {
    if (!this.mutationsEnabled) {
      throw new Error(
        "DATAHUB_MUTATIONS_ENABLED must be true before catalog write-back"
      );
    }
  }

  async callReadTool(name, args) {
    return parseToolResult(await this.client.callTool(name, args));
  }

  async requireTools(names) {
    if (!this.availableTools) {
      const response = await this.client.listTools();
      this.availableTools = new Set(
        (response?.tools ?? []).map((tool) => tool.name)
      );
    }
    const missing = names.filter((name) => !this.availableTools.has(name));
    if (missing.length) {
      throw new Error(
        `DataHub MCP server is missing required tool(s): ${missing.join(", ")}`
      );
    }
  }

  async searchAssets(assetName) {
    await this.requireTools(["search", "get_entities", "get_lineage"]);
    const queryTerms = assetName.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    return this.callReadTool("search", {
      query: `/q ${queryTerms.join("+")}`,
      filter: "entity_type = dataset",
      num_results: 10,
      offset: 0
    });
  }

  async getEntityContext(urn) {
    await this.requireTools(["get_entities"]);
    return this.callReadTool("get_entities", {
      urns: [urn]
    });
  }

  async getLineage(
    urn,
    { upstream = true, maxHops = 3, maxResults = 30 } = {}
  ) {
    await this.requireTools(["get_lineage"]);
    return this.callReadTool("get_lineage", {
      urn,
      upstream,
      max_hops: maxHops,
      max_results: maxResults,
      offset: 0
    });
  }

  async addTags(urn, tags) {
    this.assertMutationsEnabled();
    await this.requireTools(["add_tags"]);
    return this.client.callTool("add_tags", {
      tag_urns: tags.map(tagUrn),
      entity_urns: [urn]
    });
  }

  async updateDescription(urn, description) {
    this.assertMutationsEnabled();
    await this.requireTools(["update_description"]);
    return this.client.callTool("update_description", {
      entity_urn: urn,
      description,
      operation: "append"
    });
  }

  async saveAuditDocument(document) {
    this.assertMutationsEnabled();
    await this.requireTools(["save_document"]);
    return this.client.callTool("save_document", {
      document_type: "Decision",
      title: `MandateGuard audit ${document.id}`,
      content: JSON.stringify(document, null, 2),
      related_assets: document.assets.map((asset) => asset.urn)
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
