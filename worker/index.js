const ASSETS = [
  {
    urn: "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.orders,PROD)",
    name: "finance.orders",
    kind: "Dataset",
    status: "upstream"
  },
  {
    urn: "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.payments,PROD)",
    name: "finance.payments",
    kind: "Dataset",
    status: "risk"
  },
  {
    urn: "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.settlements,PROD)",
    name: "finance.settlements",
    kind: "Dataset",
    status: "protected"
  },
  {
    urn: "urn:li:dashboard:(looker,executive_revenue)",
    name: "executive_revenue",
    kind: "Dashboard",
    status: "protected"
  }
];

const BASE_TIMELINE = [
  {
    time: "09:41",
    title: "Anomaly detected",
    detail: "Order-payment amount mismatch detected on finance.payments.",
    state: "complete"
  },
  {
    time: "09:42",
    title: "Lineage resolved via DataHub MCP",
    detail: "Three downstream assets identified and impact calculated.",
    state: "complete"
  },
  {
    time: "09:43",
    title: "Quarantine applied",
    detail: "37 records isolated from downstream settlement processing.",
    state: "complete"
  },
  {
    time: "09:44",
    title: "Reconciliation plan ready",
    detail: "A deterministic repair plan is awaiting approval.",
    state: "current"
  },
  {
    time: "Pending",
    title: "Write back to DataHub",
    detail: "Tags, description, and audit document will be committed.",
    state: "pending"
  }
];

function createControlState() {
  return {
    mode: "fixture",
    runId: "run-mg-204",
    incident: {
      id: "MG-204",
      asset: "finance.payments",
      rule: "Order-payment amount mismatch",
      severity: "Critical",
      affectedRecords: 37,
      exposure: 48270,
      detectedAt: "09:41",
      status: "ready"
    },
    assets: ASSETS,
    summary: {
      monitoredAssets: 4,
      activeIncidents: 1,
      exposure: 48270
    },
    workflow: [
      { label: "Detect", state: "complete" },
      { label: "Trace impact", state: "complete" },
      { label: "Quarantine", state: "complete" },
      { label: "Reconcile", state: "current" },
      { label: "Write back", state: "pending" }
    ],
    evidence: [
      { asset: "finance.orders", detail: "12 mismatched orders" },
      { asset: "finance.payments", detail: "37 mismatched payments" },
      { asset: "finance.settlements", detail: "0 unsafe settlements posted" }
    ],
    timeline: BASE_TIMELINE.map((item) => ({ ...item })),
    writeBack: {
      tags: ["MandateGuard_Quarantined", "Finance_Critical"],
      descriptionAppended: false,
      auditDocumentSaved: false
    }
  };
}

function approveReconciliation(currentState) {
  return {
    ...currentState,
    incident: { ...currentState.incident, status: "resolved" },
    summary: { ...currentState.summary, activeIncidents: 0, exposure: 0 },
    workflow: currentState.workflow.map((step) => ({
      ...step,
      state: "complete"
    })),
    timeline: currentState.timeline.map((item, index) =>
      index === 3
        ? { ...item, state: "complete" }
        : index === 4
          ? {
              ...item,
              time: "09:45",
              state: "complete",
              detail: "Tags, description, and audit document committed to DataHub."
            }
          : item
    ),
    writeBack: {
      ...currentState.writeBack,
      descriptionAppended: true,
      auditDocumentSaved: true
    }
  };
}

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

let state = createControlState();

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/state" && request.method === "GET") {
      return json(state);
    }
    if (url.pathname === "/api/run" && request.method === "POST") {
      state = createControlState();
      return json(state);
    }
    if (url.pathname === "/api/approve" && request.method === "POST") {
      state = approveReconciliation(state);
      return json(state);
    }
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, mode: state.mode });
    }

    return env.ASSETS.fetch(request);
  }
};

export default worker;
