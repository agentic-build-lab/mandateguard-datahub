# Architecture

MandateGuard separates the deterministic control engine from DataHub access and
the user interface.

```text
React control room
        |
        v
Node control API ----> deterministic anomaly / reconciliation engine
        |
        +----> fixture gateway (public demo)
        |
        +----> DataHub MCP gateway
                 tools/list / search / get_entities / get_lineage
                 add_tags / update_description / save_document
```

The public demo defaults to a deterministic fixture so judges can run the full
workflow without credentials. Setting `DATAHUB_MCP_URL` and `DATAHUB_TOKEN`
switches the same gateway interface to DataHub's MCP Server. Catalog mutations
remain disabled until `DATAHUB_MUTATIONS_ENABLED=true`.

`POST /api/run` is the connected read path. It verifies the required tools,
searches for `finance.payments`, validates the returned entity with
`get_entities`, then reads upstream and downstream lineage. The resulting
assets and impact count come from those MCP responses. Fixture mode returns the
same shape from deterministic in-process data.

## Safety boundary

- Detection, impact calculation, and reconciliation planning are read-only.
- Quarantine is simulated against the sample operational dataset.
- Fixture approval records simulation receipts and never changes a tenant.
- DataHub catalog writes require explicit user approval in the control room.
- Remote mutations require a second deployment-level switch.
- The audit document records the incident and affected asset set.

## DataHub contribution

MandateGuard reads graph context to turn a row-level mismatch into an
organization-level impact calculation. It writes the result back as tags,
description context, and a reusable audit document, allowing the next person or
agent to inherit the decision.
