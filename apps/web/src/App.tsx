import { useCallback, useEffect, useState } from "react";
import { AuditTimeline } from "./components/AuditTimeline";
import { IncidentInspector } from "./components/IncidentInspector";
import { IncidentTable } from "./components/IncidentTable";
import { LineageGraph } from "./components/LineageGraph";
import { Sidebar } from "./components/Sidebar";
import { WorkflowRail } from "./components/WorkflowRail";
import { Icon } from "./icons";
import type { ControlState } from "./types";

async function fetchState(path: string, method = "GET") {
  const response = await fetch(path, { method });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<ControlState>;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export default function App() {
  const [state, setState] = useState<ControlState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      setState(await fetchState("/api/run", "POST"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to run control");
    } finally {
      setBusy(false);
    }
  }, []);

  const approve = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      setState(await fetchState("/api/approve", "POST"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to write back");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    fetchState("/api/state")
      .then(setState)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load"));
  }, []);

  if (!state) {
    return <main className="loading">{error || "Loading MandateGuard…"}</main>;
  }

  return (
    <div className="app-shell">
      <Sidebar mode={state.mode} />
      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>Operations control room</h1>
            <p>Resolve payment risk with DataHub context before bad data reaches finance.</p>
          </div>
          <div className="topbar-actions">
            <button className="run-button" onClick={run} disabled={busy}>
              <Icon name="play" />
              {busy ? "Running…" : "Run control"}
            </button>
            <button className="demo-button" onClick={run} disabled={busy}>
              <Icon name="refresh" />
              Demo scenario
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section className="summary-strip" aria-label="Control summary">
          <article>
            <Icon name="database" />
            <strong>{state.summary.monitoredAssets}</strong>
            <span>assets monitored</span>
          </article>
          <article>
            <Icon name="incident" />
            <strong>{state.summary.activeIncidents}</strong>
            <span>active incident</span>
          </article>
          <article>
            <Icon name="shield" />
            <strong>{money(state.summary.exposure)}</strong>
            <span>exposure</span>
          </article>
        </section>

        <WorkflowRail workflow={state.workflow} />
        <IncidentTable state={state} />
        <LineageGraph assets={state.assets} />
        <AuditTimeline timeline={state.timeline} />
      </main>
      <IncidentInspector state={state} busy={busy} onApprove={approve} />
    </div>
  );
}
