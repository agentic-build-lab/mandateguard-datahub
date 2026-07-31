import assert from "node:assert/strict";
import test from "node:test";
import { RemoteDataHubGateway } from "../services/control_api/datahub_gateway.mjs";

const PAYMENT_URN =
  "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.payments,PROD)";
const SETTLEMENT_URN =
  "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.settlements,PROD)";

class RecordingClient {
  constructor(responses = {}) {
    this.calls = [];
    this.responses = responses;
  }

  async listTools() {
    this.calls.push({ method: "tools/list" });
    return {
      tools: [
        "search",
        "get_entities",
        "get_lineage",
        "add_tags",
        "update_description",
        "save_document"
      ].map((name) => ({ name }))
    };
  }

  async callTool(name, args) {
    this.calls.push({ method: "tools/call", name, args });
    return this.responses[name] ?? { content: [] };
  }
}

test("remote gateway uses current DataHub MCP read tool payloads", async () => {
  const client = new RecordingClient({
    search: {
      structuredContent: {
        searchResults: [
          { entity: { urn: PAYMENT_URN, name: "finance.payments" } }
        ]
      }
    },
    get_entities: {
      content: [
        {
          type: "text",
          text: JSON.stringify([
            { urn: PAYMENT_URN, name: "finance.payments", type: "DATASET" }
          ])
        }
      ]
    },
    get_lineage: {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            downstreams: {
              searchResults: [
                {
                  entity: {
                    urn: SETTLEMENT_URN,
                    name: "finance.settlements",
                    type: "DATASET"
                  }
                }
              ]
            }
          })
        }
      ]
    }
  });
  const gateway = new RemoteDataHubGateway({
    client,
    mutationsEnabled: false
  });

  const search = await gateway.searchAssets("finance.payments");
  const context = await gateway.getEntityContext(PAYMENT_URN);
  const lineage = await gateway.getLineage(PAYMENT_URN, {
    upstream: false,
    maxHops: 3,
    maxResults: 30
  });

  assert.equal(search.searchResults[0].entity.urn, PAYMENT_URN);
  assert.equal(context[0].urn, PAYMENT_URN);
  assert.equal(
    lineage.downstreams.searchResults[0].entity.urn,
    SETTLEMENT_URN
  );
  assert.deepEqual(client.calls, [
    { method: "tools/list" },
    {
      method: "tools/call",
      name: "search",
      args: {
        query: "/q finance+payments",
        filter: "entity_type = dataset",
        num_results: 10,
        offset: 0
      }
    },
    {
      method: "tools/call",
      name: "get_entities",
      args: { urns: [PAYMENT_URN] }
    },
    {
      method: "tools/call",
      name: "get_lineage",
      args: {
        urn: PAYMENT_URN,
        upstream: false,
        max_hops: 3,
        max_results: 30,
        offset: 0
      }
    }
  ]);
});

test("remote gateway uses current DataHub MCP mutation payloads", async () => {
  const client = new RecordingClient();
  const gateway = new RemoteDataHubGateway({
    client,
    mutationsEnabled: true
  });

  await gateway.addTags(PAYMENT_URN, [
    "MandateGuard_Quarantined",
    "urn:li:tag:Finance_Critical"
  ]);
  await gateway.updateDescription(PAYMENT_URN, "Incident context");
  await gateway.saveAuditDocument({
    id: "run-mg-204",
    assets: [{ urn: PAYMENT_URN }, { urn: SETTLEMENT_URN }]
  });

  assert.deepEqual(client.calls, [
    { method: "tools/list" },
    {
      method: "tools/call",
      name: "add_tags",
      args: {
        tag_urns: [
          "urn:li:tag:MandateGuard_Quarantined",
          "urn:li:tag:Finance_Critical"
        ],
        entity_urns: [PAYMENT_URN]
      }
    },
    {
      method: "tools/call",
      name: "update_description",
      args: {
        entity_urn: PAYMENT_URN,
        description: "Incident context",
        operation: "append"
      }
    },
    {
      method: "tools/call",
      name: "save_document",
      args: {
        document_type: "Decision",
        title: "MandateGuard audit run-mg-204",
        content: JSON.stringify(
          {
            id: "run-mg-204",
            assets: [{ urn: PAYMENT_URN }, { urn: SETTLEMENT_URN }]
          },
          null,
          2
        ),
        related_assets: [PAYMENT_URN, SETTLEMENT_URN]
      }
    }
  ]);
});

test("remote gateway reports missing required MCP tools before a control read", async () => {
  const client = new RecordingClient();
  client.listTools = async () => ({ tools: [{ name: "search" }] });
  const gateway = new RemoteDataHubGateway({
    client,
    mutationsEnabled: false
  });

  await assert.rejects(
    gateway.searchAssets("finance.payments"),
    /missing required tool\(s\): get_entities, get_lineage/
  );
});
