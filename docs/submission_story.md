# Inspiration

Order and payment failures rarely stay inside one table. A mismatch can reach
settlement jobs, revenue dashboards, and financial decisions before an operator
understands the blast radius. Traditional reconciliation tools see records;
DataHub sees the organizational context around those records.

# What it does

MandateGuard is an AI-native operations control center that:

1. detects order-payment mismatches;
2. asks DataHub for the affected asset, schema, ownership, and downstream
   lineage;
3. quarantines unsafe records before settlement;
4. prepares a deterministic reconciliation plan for approval; and
5. writes tags, incident context, and an audit document back to
   DataHub.

The included MG-204 scenario isolates 37 payment records representing $48,270
in exposure and protects two downstream assets.

# How we built it

The project uses a React and TypeScript control room, a dependency-light Node
control API, and a pluggable DataHub gateway. The gateway speaks Model Context
Protocol over streamable HTTP. In connected mode, a control run checks the tool
catalog and calls `search`, `get_entities`, and upstream/downstream
`get_lineage` before constructing the displayed impact graph. A deterministic
fixture implements the same gateway interface so judges can test the complete
workflow without credentials or tenant access.

The control engine deliberately keeps anomaly detection and reconciliation
logic outside the interface. Human approval is required before catalog
write-back. In a connected DataHub deployment, approval invokes `add_tags`,
`update_description`, and `save_document`. In the public fixture, approval only
generates simulation receipts for those planned operations.

# Challenges we ran into

The hardest design problem was keeping the public demo instantly testable while
still making the DataHub integration real. We solved this with one gateway
contract and two implementations: a credential-free fixture and a remote MCP
client. We also kept DataHub mutations behind both a user approval and an
environment-level switch.

# Accomplishments that we're proud of

- One-screen workflow from anomaly to governed write-back.
- Downstream impact is derived from DataHub lineage, not hard-coded UI labels
  in connected mode.
- Safe public demo with deterministic evidence and sample outputs.
- Explicit audit trail for every control action.
- Apache-2.0 licensed and designed for extension to refunds, chargebacks, and
  settlement controls.

# What we learned

Metadata becomes operationally valuable when it is used before an action, not
only after an incident. DataHub allows an agent to combine technical lineage,
ownership, and business context with deterministic financial controls.

# What's next for MandateGuard

We plan to add DataHub assertions, configurable reconciliation policies,
approval routing by ownership, and additional payment-provider connectors. The
same pattern can protect any high-value operational workflow where a local data
failure has a larger downstream impact.
