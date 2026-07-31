export const ASSETS = [
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
    detail: "Fixture approval records receipts without changing a DataHub tenant.",
    state: "pending"
  }
];

function unwrapResult(value) {
  return value?.result ?? value;
}

function searchEntities(payload) {
  const value = unwrapResult(payload);
  const results = value?.searchResults ?? value?.results ?? [];
  return results
    .map((result) => result?.entity ?? result)
    .filter((entity) => entity?.urn);
}

function contextEntities(payload) {
  const value = unwrapResult(payload);
  if (Array.isArray(value)) return value.filter((entity) => entity?.urn);
  if (Array.isArray(value?.entities)) {
    return value.entities.filter((entity) => entity?.urn);
  }
  return value?.urn ? [value] : [];
}

function lineageEntities(payload, upstream) {
  const value = unwrapResult(payload);
  const direction = upstream ? "upstreams" : "downstreams";
  const results = value?.[direction]?.searchResults ?? value?.searchResults ?? [];
  return results
    .map((result) => result?.entity ?? result)
    .filter((entity) => entity?.urn);
}

function nameFromUrn(urn) {
  const body = urn.includes("(") ? urn.slice(urn.lastIndexOf("(") + 1, -1) : "";
  const values = body.split(",");
  if (urn.startsWith("urn:li:dataset:")) return values.at(-2) ?? urn;
  return values.at(-1) ?? urn;
}

function entityName(entity) {
  return (
    entity.name ??
    entity.properties?.name ??
    entity.datasetProperties?.name ??
    entity.dashboardInfo?.title ??
    nameFromUrn(entity.urn)
  );
}

function entityKind(entity) {
  const type = entity.type ?? "";
  if (type === "DASHBOARD" || entity.urn.startsWith("urn:li:dashboard:")) {
    return "Dashboard";
  }
  if (type === "CHART" || entity.urn.startsWith("urn:li:chart:")) {
    return "Chart";
  }
  if (type === "DATA_JOB" || entity.urn.startsWith("urn:li:dataJob:")) {
    return "Data job";
  }
  return "Dataset";
}

function controlAsset(entity, status) {
  return {
    urn: entity.urn,
    name: entityName(entity),
    kind: entityKind(entity),
    status
  };
}

function uniqueAssets(assets) {
  const seen = new Set();
  return assets.filter((asset) => {
    if (seen.has(asset.urn)) return false;
    seen.add(asset.urn);
    return true;
  });
}

function buildEvidence(assets, fixtureMode) {
  if (fixtureMode) {
    return [
      { asset: "finance.orders", detail: "12 mismatched orders" },
      { asset: "finance.payments", detail: "37 mismatched payments" },
      { asset: "finance.settlements", detail: "0 unsafe settlements posted" }
    ];
  }

  const riskAsset = assets.find((asset) => asset.status === "risk");
  const upstreamAsset = assets.find((asset) => asset.status === "upstream");
  const downstreamAsset = assets.find((asset) => asset.status === "protected");
  return [
    upstreamAsset && {
      asset: upstreamAsset.name,
      detail: "Upstream dependency verified by DataHub lineage"
    },
    riskAsset && {
      asset: riskAsset.name,
      detail: "37 mismatched operational records"
    },
    downstreamAsset && {
      asset: downstreamAsset.name,
      detail: "Downstream dependency protected by quarantine"
    }
  ].filter(Boolean);
}

export function createControlState({
  mode = process.env.DATAHUB_MCP_URL ? "connected" : "fixture",
  assets = ASSETS,
  catalogRead = null
} = {}) {
  const fixtureMode = mode === "fixture";
  const connectedReadPending = !fixtureMode && !catalogRead;
  const riskAsset = assets.find((asset) => asset.status === "risk") ?? assets[0];
  const downstreamCount = assets.filter(
    (asset) => asset.status === "protected" || asset.status === "downstream"
  ).length;
  const timeline = BASE_TIMELINE.map((item, index) => {
    if (index === 1) {
      return {
        ...item,
        title: connectedReadPending
          ? "DataHub MCP read pending"
          : fixtureMode
            ? "Lineage resolved from deterministic fixture"
            : "Lineage resolved via DataHub MCP",
        detail: connectedReadPending
          ? "Run control to discover the asset, validate entity context, and read lineage."
          : `${downstreamCount} downstream asset${downstreamCount === 1 ? "" : "s"} identified and impact calculated.`,
        state: connectedReadPending ? "current" : item.state
      };
    }
    if (connectedReadPending && index > 1) {
      return { ...item, state: "pending" };
    }
    if (index === 4 && !fixtureMode) {
      return {
        ...item,
        title: "Write back to DataHub",
        detail: "Tags, description, and audit document are staged for approval."
      };
    }
    return { ...item };
  });

  return {
    mode,
    runId: "run-mg-204",
    incident: {
      id: "MG-204",
      asset: riskAsset.name,
      assetUrn: riskAsset.urn,
      rule: "Order-payment amount mismatch",
      severity: "Critical",
      affectedRecords: 37,
      exposure: 48270,
      detectedAt: "09:41",
      status: "ready"
    },
    assets,
    summary: {
      monitoredAssets: assets.length,
      activeIncidents: 1,
      exposure: 48270
    },
    workflow: connectedReadPending
      ? [
          { label: "Detect", state: "complete" },
          { label: "Trace impact", state: "current" },
          { label: "Quarantine", state: "pending" },
          { label: "Reconcile", state: "pending" },
          { label: "Write back", state: "pending" }
        ]
      : [
          { label: "Detect", state: "complete" },
          { label: "Trace impact", state: "complete" },
          { label: "Quarantine", state: "complete" },
          { label: "Reconcile", state: "current" },
          { label: "Write back", state: "pending" }
        ],
    evidence: buildEvidence(assets, fixtureMode),
    timeline,
    writeBack: {
      tags: ["MandateGuard_Quarantined", "Finance_Critical"],
      descriptionAppended: false,
      auditDocumentSaved: false,
      simulationReceipts: 0
    },
    ...(catalogRead ? { catalogRead } : {})
  };
}

export async function runControl(gateway) {
  const targetAssetName = "finance.payments";
  const discoveredAssets = searchEntities(
    await gateway.searchAssets(targetAssetName)
  );
  const discovered = discoveredAssets.find(
    (entity) =>
      entityName(entity).toLowerCase() === targetAssetName ||
      nameFromUrn(entity.urn).toLowerCase() === targetAssetName
  );
  if (!discovered) {
    throw new Error(
      `DataHub search did not return the required asset ${targetAssetName}`
    );
  }

  const [contextPayload, upstreamPayload, downstreamPayload] = await Promise.all([
    gateway.getEntityContext(discovered.urn),
    gateway.getLineage(discovered.urn, { upstream: true }),
    gateway.getLineage(discovered.urn, { upstream: false })
  ]);
  const context = contextEntities(contextPayload).find(
    (entity) => entity.urn === discovered.urn
  );
  if (!context) {
    throw new Error(`DataHub entity context missing for ${discovered.urn}`);
  }

  const upstream = lineageEntities(upstreamPayload, true);
  const downstream = lineageEntities(downstreamPayload, false);
  const assets = uniqueAssets([
    ...upstream.map((entity) => controlAsset(entity, "upstream")),
    controlAsset({ ...discovered, ...context }, "risk"),
    ...downstream.map((entity) => controlAsset(entity, "protected"))
  ]);

  return createControlState({
    mode: gateway.mode ?? "connected",
    assets,
    catalogRead: {
      source: gateway.mode === "fixture" ? "deterministic_fixture" : "datahub_mcp",
      assetUrn: discovered.urn,
      upstreamCount: upstream.length,
      downstreamCount: downstream.length
    }
  });
}

export async function approveReconciliation(state, gateway) {
  if (state.mode === "connected" && !state.catalogRead) {
    throw new Error(
      "Run control to validate DataHub entity context and lineage before approval"
    );
  }
  const paymentAsset =
    state.assets.find((asset) => asset.urn === state.incident.assetUrn) ??
    state.assets.find((asset) => asset.status === "risk");
  if (!paymentAsset) throw new Error("Risk asset is missing from control state");
  const downstreamAssets = state.assets
    .filter((asset) => asset.status === "protected")
    .map((asset) => asset.name);
  const protectedDetail = downstreamAssets.length
    ? `Protected downstream assets: ${downstreamAssets.join(", ")}.`
    : "No downstream assets were returned by the current lineage query.";

  await gateway.addTags(paymentAsset.urn, state.writeBack.tags);
  await gateway.updateDescription(
    paymentAsset.urn,
    `MandateGuard MG-204: 37 mismatched payment records quarantined and reconciled. ${protectedDetail}`
  );
  await gateway.saveAuditDocument({
    id: state.runId,
    incident: state.incident,
    assets: state.assets
  });
  const fixtureMode = state.mode === "fixture";

  return {
    ...state,
    incident: { ...state.incident, status: "resolved" },
    summary: { ...state.summary, activeIncidents: 0, exposure: 0 },
    workflow: state.workflow.map((step) => ({ ...step, state: "complete" })),
    timeline: state.timeline.map((item, index) =>
      index === 3
        ? { ...item, state: "complete" }
        : index === 4
          ? {
              ...item,
              time: "09:45",
              state: "complete",
              detail: fixtureMode
                ? "Fixture receipts generated; no DataHub tenant was changed."
                : "Tags, description, and audit document committed to DataHub."
            }
          : item
    ),
    writeBack: {
      ...state.writeBack,
      descriptionAppended: !fixtureMode,
      auditDocumentSaved: !fixtureMode,
      simulationReceipts: fixtureMode ? 3 : 0
    }
  };
}
