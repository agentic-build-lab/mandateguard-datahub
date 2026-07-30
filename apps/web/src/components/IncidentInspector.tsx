import { Icon } from "../icons";
import type { ControlState } from "../types";

export function IncidentInspector({
  state,
  busy,
  onApprove
}: {
  state: ControlState;
  busy: boolean;
  onApprove: () => void;
}) {
  const resolved = state.incident.status === "resolved";
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
        <div><Icon name="database" /><strong>{state.incident.affectedRecords}</strong><span>records isolated</span></div>
        <div><Icon name="shield" /><strong>3</strong><span>downstream assets protected</span></div>
      </div>

      <section className="evidence">
        <h3>Evidence</h3>
        {state.evidence.map((item) => (
          <button key={item.asset}>
            <Icon name={item.asset.includes("payments") ? "database" : "audit"} />
            <span><strong>{item.asset}</strong><small>{item.detail}</small></span>
            <Icon name="chevron" />
          </button>
        ))}
      </section>

      <dl className="incident-meta">
        <div><dt>Rule</dt><dd>{state.incident.rule}</dd></div>
        <div><dt>Detected</dt><dd>Today, {state.incident.detectedAt}</dd></div>
        <div><dt>Write-back</dt><dd>{resolved ? "Committed to DataHub" : "Ready for approval"}</dd></div>
      </dl>

      <div className="inspector-actions">
        <button className="primary-action" onClick={onApprove} disabled={busy || resolved}>
          <Icon name={resolved ? "check" : "shield"} />
          {busy ? "Writing to DataHub…" : resolved ? "Reconciliation approved" : "Approve reconciliation"}
        </button>
        <button className="secondary-action">
          <Icon name="audit" />
          Review evidence
        </button>
      </div>
    </aside>
  );
}
