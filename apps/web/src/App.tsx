import { useCallback, useEffect, useState } from "react";
import { AuditTimeline } from "./components/AuditTimeline";
import { IncidentInspector } from "./components/IncidentInspector";
import { IncidentTable } from "./components/IncidentTable";
import { LineageGraph } from "./components/LineageGraph";
import { Sidebar, type NavSection } from "./components/Sidebar";
import { WorkflowRail } from "./components/WorkflowRail";
import { approveDemoState, createDemoState } from "./demo_state";
import { Icon } from "./icons";
import type { ControlState } from "./types";

const isStaticDemo = import.meta.env.BASE_URL !== "/";
const runStages = [
  "Detecting mismatch",
  "Replaying deterministic lineage",
  "Quarantining 37 records",
  "Preparing reconciliation"
];

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

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

function runningState(finalState: ControlState, stage: number): ControlState {
  const assets = stage === 0
    ? finalState.assets.slice(0, 2)
    : finalState.assets.map((asset) => (
        stage < 3 && asset.status === "protected"
          ? { ...asset, status: "downstream" as const }
          : asset
      ));
  const evidence = stage < 1
    ? finalState.evidence.filter((item) => item.asset === "finance.payments")
    : finalState.evidence;

  return {
    ...finalState,
    assets,
    evidence,
    workflow: finalState.workflow.map((step, index) => ({
      ...step,
      state: (
        index < stage ? "complete" : index === stage ? "current" : "pending"
      ) as ControlState["workflow"][number]["state"]
    })),
    timeline: finalState.timeline.map((item, index) => ({
      ...item,
      state: (
        index < stage ? "complete" : index === stage ? "current" : "pending"
      ) as ControlState["timeline"][number]["state"]
    }))
  };
}

export default function App() {
  const [state, setState] = useState<ControlState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<NavSection>("control-room");
  const [selectedEvidenceUrn, setSelectedEvidenceUrn] = useState("");
  const [activity, setActivity] = useState("");
  const [notice, setNotice] = useState("");

  const navigate = useCallback((section: NavSection) => {
    setActiveSection(section);
    window.requestAnimationFrame(() => {
      const target = document.getElementById(section);
      if (!target) return;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 18,
        left: 0,
        behavior: "smooth",
      });
    });
  }, []);

  const run = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      if (isStaticDemo) {
        const finalState = createDemoState();
        for (let stage = 0; stage < runStages.length; stage += 1) {
          setActivity(runStages[stage]);
          setState(runningState(finalState, stage));
          await delay(430);
        }
        setState(finalState);
        setActivity("Control complete | approval required");
        setNotice("Control run completed with deterministic fixture data.");
      } else {
        setState(await fetchState("/api/run", "POST"));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to run control");
    } finally {
      setBusy(false);
    }
  }, []);

  const resetDemo = useCallback(() => {
    setState(createDemoState());
    setSelectedEvidenceUrn("");
    setActivity("");
    setNotice("Demo scenario reset to MG-204.");
    navigate("control-room");
  }, [navigate]);

  const approve = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      if (isStaticDemo) {
        setActivity("Simulating governed fixture write-back");
        await delay(460);
        setState((current) => approveDemoState(current ?? createDemoState()));
        setActivity("Fixture write-back simulated | 3 audit receipts");
        setNotice("Reconciliation approved and fixture receipts generated.");
      } else {
        setState(await fetchState("/api/approve", "POST"));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to write back");
    } finally {
      setBusy(false);
    }
  }, []);

  const selectEvidence = useCallback((assetUrn: string, assetName: string) => {
    setSelectedEvidenceUrn(assetUrn);
    setNotice(`${assetName} focused in the lineage graph.`);
    navigate("lineage");
  }, [navigate]);

  const reviewEvidence = useCallback(() => {
    const paymentsUrn = state?.assets.find(
      (asset) => asset.name === "finance.payments"
    )?.urn;
    if (paymentsUrn) {
      setSelectedEvidenceUrn(paymentsUrn);
    }
    setNotice("Risk evidence focused on finance.payments.");
    navigate("lineage");
  }, [navigate, state]);

  useEffect(() => {
    if (isStaticDemo) {
      setState(createDemoState());
      return;
    }

    fetchState("/api/state")
      .then(setState)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load"));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!state) {
    return <main className="loading">{error || "Loading MandateGuard..."}</main>;
  }

  const fixtureMode = isStaticDemo || state.mode === "fixture";
  const quarantineComplete =
    state.workflow.find((step) => step.label === "Quarantine")?.state === "complete";

  return (
    <div className="app-shell">
      <Sidebar
        mode={state.mode}
        activeSection={activeSection}
        onNavigate={navigate}
      />
      <main className="workspace">
        <section
          id="control-room"
          className={`section-anchor control-overview${activeSection === "control-room" ? " section-active" : ""}`}
        >
          <header className="topbar">
            <div>
              <h1>Operations control room</h1>
              <p>Resolve payment risk with DataHub context before bad data reaches finance.</p>
            </div>
            <div className="topbar-actions">
              <button className="run-button" onClick={run} disabled={busy}>
                <Icon name="play" />
                {busy ? "Running..." : "Run control"}
              </button>
              {isStaticDemo && (
                <button className="demo-button" onClick={resetDemo} disabled={busy}>
                  <Icon name="refresh" />
                  Reset scenario
                </button>
              )}
            </div>
          </header>

          {error && <div className="error-banner">{error}</div>}
          {activity && (
            <div className="control-activity" key={activity}>
              <span />
              {activity}
            </div>
          )}

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
        </section>

        <div
          id="incidents"
          className={`section-anchor${activeSection === "incidents" ? " section-active" : ""}`}
        >
          <IncidentTable state={state} />
        </div>
        <div
          id="lineage"
          className={`section-anchor${activeSection === "lineage" ? " section-active" : ""}`}
        >
          <LineageGraph
            assets={state.assets}
            focusedAssetUrn={selectedEvidenceUrn}
            quarantineComplete={quarantineComplete}
          />
        </div>
        <div
          id="audit-log"
          className={`section-anchor${activeSection === "audit-log" ? " section-active" : ""}`}
        >
          <AuditTimeline timeline={state.timeline} />
        </div>

        <section
          id="settings"
          className={`surface settings-surface section-anchor${activeSection === "settings" ? " section-active" : ""}`}
        >
          <header className="surface-header"><h2>Demo settings</h2></header>
          <div className="settings-grid">
            <article>
              <span>Execution mode</span>
              <strong>{state.mode === "fixture" ? "Deterministic fixture" : "Connected DataHub"}</strong>
              <small>The public build never mutates a tenant.</small>
            </article>
            <article>
              <span>Gateway</span>
              <strong>
                {state.mode === "connected"
                  ? "Connected MCP gateway"
                  : "Connected gateway included"}
              </strong>
              <small>
                {state.mode === "connected"
                  ? "Run control validates search, entity, and lineage tools."
                  : "Configure environment variables to enable remote MCP reads."}
              </small>
            </article>
            <article>
              <span>Mutation policy</span>
              <strong>Human approval required</strong>
              <small>Write-back stays gated until reconciliation is approved.</small>
            </article>
          </div>
          {isStaticDemo && (
            <button className="settings-reset" onClick={resetDemo} disabled={busy}>
              <Icon name="refresh" />
              Reset MG-204 fixture
            </button>
          )}
        </section>

        {notice && <div className="toast" role="status">{notice}</div>}
      </main>
      <IncidentInspector
        state={state}
        busy={busy}
        fixtureMode={fixtureMode}
        onApprove={approve}
        selectedEvidenceUrn={selectedEvidenceUrn}
        onSelectEvidence={selectEvidence}
        onReviewEvidence={reviewEvidence}
      />
    </div>
  );
}
