import { Icon, type IconName } from "../icons";

const items: Array<{ label: string; icon: IconName }> = [
  { label: "Control room", icon: "control" },
  { label: "Incidents", icon: "incident" },
  { label: "Lineage", icon: "lineage" },
  { label: "Audit log", icon: "audit" },
  { label: "Settings", icon: "settings" }
];

export function Sidebar({ mode }: { mode: "connected" | "fixture" }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Icon name="shield" />
        </span>
        <span>MandateGuard</span>
      </div>

      <nav aria-label="Primary">
        {items.map((item, index) => (
          <button className={index === 0 ? "nav-item active" : "nav-item"} key={item.label}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="connection">
          <span className={mode === "connected" ? "dot connected" : "dot"} />
          <span>
            DataHub {mode === "connected" ? "connected" : "fixture mode"}
            <small>via MCP</small>
          </span>
        </div>
        <div className="profile">
          <span className="avatar">LC</span>
          <span>
            Liu Chongxin
            <small>Platform engineer</small>
          </span>
          <Icon name="chevron" />
        </div>
      </div>
    </aside>
  );
}
