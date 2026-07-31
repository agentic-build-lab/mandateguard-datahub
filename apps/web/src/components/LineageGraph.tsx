import { Icon } from "../icons";
import type { ControlState } from "../types";

export function LineageGraph({
  assets,
  focusedAssetUrn,
  quarantineComplete
}: {
  assets: ControlState["assets"];
  focusedAssetUrn?: string;
  quarantineComplete: boolean;
}) {
  return (
    <section className="surface lineage-surface">
      <header className="surface-header lineage-header">
        <h2>DataHub lineage <span className="info">i</span></h2>
        <div className="legend">
          <span><i className="line-solid" />Lineage path</span>
          <span><i className="box-risk" />At risk</span>
          <span><i className="line-dashed" />Downstream</span>
        </div>
      </header>
      <div className="lineage-grid">
        {assets.map((asset, index) => (
          <div className="lineage-fragment" key={asset.urn}>
            <article
              className={`asset-node ${asset.status}${focusedAssetUrn === asset.urn ? " focused" : ""}`}
              aria-label={`${asset.name}, ${asset.status}`}
            >
              <Icon name={asset.kind === "Dashboard" ? "lineage" : "database"} />
              <span>
                <strong>{asset.name}</strong>
                <small>{asset.kind}</small>
                <em>
                  {asset.status === "risk"
                    ? quarantineComplete
                      ? "Quarantined (MG-204)"
                      : "At risk (MG-204)"
                    : asset.status === "downstream"
                      ? "Downstream"
                    : asset.status === "protected"
                      ? "Protected"
                      : "Upstream"}
                </em>
              </span>
            </article>
            {index < assets.length - 1 && (
              <span
                className={
                  index === assets.length - 2 ? "connector dashed" : "connector"
                }
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
