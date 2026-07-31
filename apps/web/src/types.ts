export type StepState = "complete" | "current" | "pending";

export interface ControlState {
  mode: "connected" | "fixture";
  runId: string;
  incident: {
    id: string;
    asset: string;
    assetUrn?: string;
    rule: string;
    severity: string;
    affectedRecords: number;
    exposure: number;
    detectedAt: string;
    status: "ready" | "resolved";
  };
  summary: {
    monitoredAssets: number;
    activeIncidents: number;
    exposure: number;
  };
  workflow: Array<{ label: string; state: StepState }>;
  assets: Array<{
    urn: string;
    name: string;
    kind: string;
    status: "upstream" | "risk" | "downstream" | "protected";
  }>;
  evidence: Array<{ asset: string; detail: string }>;
  timeline: Array<{
    time: string;
    title: string;
    detail: string;
    state: StepState;
  }>;
  writeBack: {
    tags: string[];
    descriptionAppended: boolean;
    auditDocumentSaved: boolean;
    simulationReceipts: number;
  };
  catalogRead?: {
    source: "deterministic_fixture" | "datahub_mcp";
    assetUrn: string;
    upstreamCount: number;
    downstreamCount: number;
  };
}
