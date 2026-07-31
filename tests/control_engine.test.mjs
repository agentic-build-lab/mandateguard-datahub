import assert from "node:assert/strict";
import test from "node:test";
import {
  approveReconciliation,
  createControlState,
  runControl
} from "../services/control_api/control_engine.mjs";
import { FixtureDataHubGateway } from "../services/control_api/datahub_gateway.mjs";

test("control state starts with one quarantined incident ready for approval", () => {
  const state = createControlState();
  assert.equal(state.incident.id, "MG-204");
  assert.equal(state.incident.status, "ready");
  assert.equal(state.summary.activeIncidents, 1);
  assert.equal(state.workflow.at(-1).state, "pending");
});

test("connected state requires a verified catalog read before approval", async () => {
  const state = createControlState({ mode: "connected" });
  let mutationCalled = false;
  const gateway = {
    addTags: async () => {
      mutationCalled = true;
    }
  };

  assert.equal(state.workflow[1].state, "current");
  assert.equal(state.timeline[1].title, "DataHub MCP read pending");
  await assert.rejects(
    approveReconciliation(state, gateway),
    /Run control to validate DataHub entity context and lineage/
  );
  assert.equal(mutationCalled, false);
});

test("approval closes exposure and records all DataHub write-back operations", async () => {
  const gateway = new FixtureDataHubGateway();
  const resolved = await approveReconciliation(createControlState(), gateway);

  assert.equal(resolved.incident.status, "resolved");
  assert.equal(resolved.summary.activeIncidents, 0);
  assert.equal(resolved.summary.exposure, 0);
  assert.ok(resolved.workflow.every((step) => step.state === "complete"));
  assert.equal(resolved.writeBack.descriptionAppended, false);
  assert.equal(resolved.writeBack.auditDocumentSaved, false);
  assert.equal(resolved.writeBack.simulationReceipts, 3);
  assert.deepEqual(
    gateway.events.map((event) => event.tool),
    ["add_tags", "update_description", "save_document"]
  );
});

test("fixture control run deterministically resolves entity context and lineage", async () => {
  const gateway = new FixtureDataHubGateway();
  const state = await runControl(gateway);

  assert.equal(state.mode, "fixture");
  assert.deepEqual(
    state.assets.map((asset) => [asset.name, asset.status]),
    [
      ["finance.orders", "upstream"],
      ["finance.payments", "risk"],
      ["finance.settlements", "protected"],
      ["executive_revenue", "protected"]
    ]
  );
  assert.deepEqual(state.catalogRead, {
    source: "deterministic_fixture",
    assetUrn:
      "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.payments,PROD)",
    upstreamCount: 1,
    downstreamCount: 2
  });
  assert.deepEqual(
    gateway.reads.map((event) => event.tool),
    ["search", "get_entities", "get_lineage", "get_lineage"]
  );
});

test("connected control run builds the asset graph from gateway responses", async () => {
  const paymentUrn =
    "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.payments,PROD)";
  const gateway = {
    mode: "connected",
    searchAssets: async () => ({
      searchResults: [
        {
          entity: {
            urn: paymentUrn,
            name: "finance.payments",
            type: "DATASET"
          }
        }
      ]
    }),
    getEntityContext: async () => ({
      urn: paymentUrn,
      name: "finance.payments",
      type: "DATASET",
      properties: { description: "Payment ledger" }
    }),
    getLineage: async (_urn, { upstream }) =>
      upstream
        ? {
            upstreams: {
              searchResults: [
                {
                  entity: {
                    urn: "urn:li:dataset:(urn:li:dataPlatform:snowflake,raw.order_events,PROD)",
                    name: "raw.order_events",
                    type: "DATASET"
                  }
                }
              ]
            }
          }
        : {
            downstreams: {
              searchResults: [
                {
                  entity: {
                    urn: "urn:li:dashboard:(looker,finance_health)",
                    name: "finance_health",
                    type: "DASHBOARD"
                  }
                }
              ]
            }
          }
  };

  const state = await runControl(gateway);

  assert.equal(state.mode, "connected");
  assert.deepEqual(
    state.assets.map((asset) => [asset.name, asset.kind, asset.status]),
    [
      ["raw.order_events", "Dataset", "upstream"],
      ["finance.payments", "Dataset", "risk"],
      ["finance_health", "Dashboard", "protected"]
    ]
  );
  assert.equal(state.summary.monitoredAssets, 3);
  assert.equal(state.catalogRead.source, "datahub_mcp");
  assert.equal(state.catalogRead.downstreamCount, 1);
  assert.match(state.timeline[1].title, /DataHub MCP/);
});
