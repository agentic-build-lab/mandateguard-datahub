import type { ControlState } from "../types";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function IncidentTable({ state }: { state: ControlState }) {
  const { incident } = state;
  return (
    <section className="surface incident-surface">
      <header className="surface-header">
        <h2>Incidents <span>({state.summary.activeIncidents} active)</span></h2>
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Asset</th>
              <th>Rule</th>
              <th>Severity</th>
              <th>Affected records</th>
              <th>Exposure</th>
              <th>Detected at</th>
            </tr>
          </thead>
          <tbody>
            <tr className="selected">
              <td><span className="row-select" />{incident.id}</td>
              <td>{incident.asset}</td>
              <td>{incident.rule}</td>
              <td><span className="severity-dot" />{incident.severity}</td>
              <td>{incident.affectedRecords}</td>
              <td>{money(incident.exposure)}</td>
              <td>{incident.detectedAt}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer className="table-footer">
        Showing 1 of 1 incident
        <span>1</span>
      </footer>
    </section>
  );
}
