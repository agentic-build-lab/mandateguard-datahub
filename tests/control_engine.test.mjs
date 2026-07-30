import assert from "node:assert/strict";
import test from "node:test";
import {
  approveReconciliation,
  createControlState
} from "../services/control_api/control_engine.mjs";
import { FixtureDataHubGateway } from "../services/control_api/datahub_gateway.mjs";

test("control state starts with one quarantined incident ready for approval", () => {
  const state = createControlState();
  assert.equal(state.incident.id, "MG-204");
  assert.equal(state.incident.status, "ready");
  assert.equal(state.summary.activeIncidents, 1);
  assert.equal(state.workflow.at(-1).state, "pending");
});

test("approval closes exposure and records all DataHub write-back operations", async () => {
  const gateway = new FixtureDataHubGateway();
  const resolved = await approveReconciliation(createControlState(), gateway);

  assert.equal(resolved.incident.status, "resolved");
  assert.equal(resolved.summary.activeIncidents, 0);
  assert.equal(resolved.summary.exposure, 0);
  assert.ok(resolved.workflow.every((step) => step.state === "complete"));
  assert.deepEqual(
    gateway.events.map((event) => event.tool),
    ["add_tags", "update_description", "save_document"]
  );
});
