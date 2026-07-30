# MandateGuard

MandateGuard is an AI-native operations data control center built for the
**Build with DataHub: The Agent Hackathon**. It detects order/payment
mismatches, calculates downstream impact with DataHub lineage, quarantines
unsafe records, prepares a reconciliation plan, and writes governed results
back to DataHub.

![MandateGuard control room](outputs/qa/mandateguard_resolved.png)

## Why DataHub

Without metadata context, an operations agent can identify bad rows but cannot
reliably answer what will break next, who owns it, or where to leave reusable
knowledge. MandateGuard uses DataHub MCP for:

- asset discovery and entity context;
- upstream/downstream lineage and impact analysis;
- quarantine and finance-critical tags;
- appended incident context; and
- a durable audit document for future people and agents.

## Run locally

Requirements: Node.js 20+.

```bash
npm install
npm run build
npm start
```

Open `http://127.0.0.1:8787`.

For development:

```bash
npm run dev
```

The React app runs at `http://127.0.0.1:4173` and proxies API calls to port
`8787`.

## Connect DataHub MCP

Copy `.env.example` values into your process environment:

```text
DATAHUB_MCP_URL=https://<tenant>.acryl.io/integrations/ai/mcp
DATAHUB_TOKEN=<personal-access-token>
DATAHUB_MUTATIONS_ENABLED=true
```

Self-hosted DataHub can use `http://<gms-host>:8080/mcp`. Keep mutations
disabled while validating connectivity.

## Demo workflow

1. Select **Run control** to load the deterministic MG-204 scenario.
2. Inspect the order-payment mismatch and DataHub lineage blast radius.
3. Select **Approve reconciliation**.
4. Verify exposure reaches zero and the final audit step completes.

The fixture gateway records the same three tool calls used by the remote
gateway: `add_tags`, `update_description`, and `save_document`.

## Quality checks

```bash
npm run check
```

Sample output is available in
[`examples/sample_outputs/mg_204_audit.json`](examples/sample_outputs/mg_204_audit.json).

## Pre-existing work disclosure

The entrant previously created an Operations Data Control Center prototype
that informed the problem selection and domain requirements. MandateGuard's
code, DataHub MCP integration, interface, sample scenario, documentation, and
submission assets were created from scratch during the hackathon submission
period. No source code from the earlier prototype is included.

## License

Apache License 2.0.
