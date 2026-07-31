import { Icon } from "../icons";
import type { ControlState } from "../types";

export function IncidentInspector({
  state,
  busy,
  fixtureMode,
  onApprove,
  selectedEvidenceUrn,
  onSelectEvidence,
  onReviewEvidence
}: {
  state: ControlState;
  busy: boolean;
  fixtureMode: boolean;
  onApprove: () => void;
  selectedEvidenceUrn?: string;
  onSelectEvidence: (assetUrn: string, assetName: string) => void;
  onReviewEvidence: () => void;
}) {
  const resolved = state.incident.status === "resolved";
  const quarantineComplete =
    state.workflow.find((step) => step.label === "Quarantine")?.state === "complete";
  const isolatedCount = quarantineComplete ? state.incident.affectedRecords : 0;
  const protectedCount = quarantineComplete
    ? state.assets.filter((asset) => asset.status === "protected").length
    : 0;
  const writeBackStatus = resolved
    ? fixtureMode
      ? "Fixture receipt generated"
      : "Committed to DataHub"
    : fixtureMode
      ? "Ready for simulated approval"
      : "Ready for approval";

  return (
    <aside className="inspector">
      <div className="inspector-title">
        <div>
          <h2>{state.incident.id}</h2>
          <span className={resolved ? "status resolved" : "status critical"}>
            {resolved ? "Resolved" : "Critical"}
          </span>
        </div>
      </div>

      <div className="inspector-metrics">
        <div>
          <Icon name="database" />
          <strong>{isolatedCount}</strong>
          <span>records isolated</span>
        </div>
        <div>
          <Icon name="shield" />
          <strong>{protectedCount}</strong>
          <span>downstream assets protected</span>
        </div>
      </div>

      <section className="evidence">
        <h3>Evidence</h3>
        {state.evidence.map((item) => {
          const asset = state.assets.find((candidate) => candidate.name === item.asset);
          const assetUrn = asset?.urn ?? item.asset;
          const isSelected = selectedEvidenceUrn === assetUrn;
          const isRisk = asset?.status === "risk";

          return (
            <button
              key={assetUrn}
              className={`${isSelected ? "selected" : ""}${isRisk ? " risk-evidence" : ""}`.trim()}
              aria-pressed={isSelected}
              onClick={() => onSelectEvidence(assetUrn, item.asset)}
            >
              <Icon name={isRisk ? "database" : "audit"} />
              <span>
                <strong>{item.asset}</strong>
                <small>{item.detail}</small>
              </span>
              <Icon name="chevron" />
            </button>
          );
        })}
      </section>

      <dl className="incident-meta">
        <div><dt>Rule</dt><dd>{state.incident.rule}</dd></div>
        <div><dt>Detected</dt><dd>Today, {state.incident.detectedAt}</dd></div>
        <div><dt>Write-back</dt><dd>{writeBackStatus}</dd></div>
      </dl>

      <div className="inspector-actions">
        <button className="primary-action" onClick={onApprove} disabled={busy || resolved}>
          <Icon name={resolved ? "check" : "shield"} />
          {busy
            ? fixtureMode
              ? "Simulating fixture write-back..."
              : "Writing to DataHub..."
            : resolved
              ? fixtureMode
                ? "Fixture approval simulated"
                : "Reconciliation approved"
              : "Approve reconciliation"}
        </button>
        <button className="secondary-action" onClick={onReviewEvidence} disabled={busy}>
          <Icon name="audit" />
          Review evidence
        </button>
      </div>
    </aside>
  );
}
