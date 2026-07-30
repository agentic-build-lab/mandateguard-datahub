export type StepState = "complete" | "current" | "pending";

export interface ControlState {
  mode: "connected" | "fixture";
  runId: string;
  incident: {
    id: string;
    asset: string;
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
    status: "upstream" | "risk" | "protected";
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
  };
}
