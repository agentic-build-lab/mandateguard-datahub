import type { ControlState } from "./types";

const assets: ControlState["assets"] = [
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

export function createDemoState(): ControlState {
  return {
    mode: "fixture",
    runId: "run-mg-204",
    incident: {
      id: "MG-204",
      asset: "finance.payments",
      assetUrn:
        "urn:li:dataset:(urn:li:dataPlatform:snowflake,finance.payments,PROD)",
      rule: "Order-payment amount mismatch",
      severity: "Critical",
      affectedRecords: 37,
      exposure: 48270,
      detectedAt: "09:41",
      status: "ready"
    },
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
    assets,
    evidence: [
      { asset: "finance.orders", detail: "12 mismatched orders" },
      { asset: "finance.payments", detail: "37 mismatched payments" },
      { asset: "finance.settlements", detail: "0 unsafe settlements posted" }
    ],
    timeline: [
      {
        time: "09:41",
        title: "Anomaly detected",
        detail: "Order-payment amount mismatch detected on finance.payments.",
        state: "complete"
      },
      {
        time: "09:42",
        title: "Lineage resolved from deterministic fixture",
        detail: "Two downstream assets identified and impact calculated.",
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
        title: "Prepare DataHub write-back",
        detail: "Public fixture records receipts; the connected gateway can commit them.",
        state: "pending"
      }
    ],
    writeBack: {
      tags: ["MandateGuard_Quarantined", "Finance_Critical"],
      descriptionAppended: false,
      auditDocumentSaved: false,
      simulationReceipts: 0
    }
  };
}

export function approveDemoState(state: ControlState): ControlState {
  return {
    ...state,
    incident: { ...state.incident, status: "resolved" },
    summary: { ...state.summary, activeIncidents: 0, exposure: 0 },
    workflow: state.workflow.map((step) => ({
      ...step,
      state: "complete"
    })),
    timeline: state.timeline.map((item, index) =>
      index === 3
        ? { ...item, state: "complete" }
        : index === 4
          ? {
              ...item,
              time: "09:45",
              state: "complete",
              detail: "Fixture receipts generated for tags, description, and audit document."
            }
          : item
    ),
    writeBack: {
      ...state.writeBack,
      descriptionAppended: false,
      auditDocumentSaved: false,
      simulationReceipts: 3
    }
  };
}
