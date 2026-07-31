import { Icon, type IconName } from "../icons";

export type NavSection = "control-room" | "incidents" | "lineage" | "audit-log" | "settings";

const items: Array<{ id: NavSection; label: string; icon: IconName }> = [
  { id: "control-room", label: "Control room", icon: "control" },
  { id: "incidents", label: "Incidents", icon: "incident" },
  { id: "lineage", label: "Lineage", icon: "lineage" },
  { id: "audit-log", label: "Audit log", icon: "audit" },
  { id: "settings", label: "Settings", icon: "settings" }
];

export function Sidebar({
  mode,
  activeSection,
  onNavigate
}: {
  mode: "connected" | "fixture";
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Icon name="shield" />
        </span>
        <span>MandateGuard</span>
      </div>

      <nav aria-label="Primary">
        {items.map((item) => (
          <button
            className={activeSection === item.id ? "nav-item active" : "nav-item"}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            aria-current={activeSection === item.id ? "page" : undefined}
          >
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
        </div>
      </div>
    </aside>
  );
}
