import { Icon } from "../icons";
import type { ControlState } from "../types";

export function AuditTimeline({
  timeline
}: {
  timeline: ControlState["timeline"];
}) {
  return (
    <section className="surface audit-surface">
      <header className="surface-header">
        <h2>Audit timeline <span className="info">i</span></h2>
      </header>
      <div className="timeline">
        {timeline.map((event, index) => (
          <article className={`timeline-event ${event.state}`} key={`${event.time}-${event.title}`}>
            <div className="timeline-marker">
              {event.state === "complete" ? <Icon name="check" /> : index + 1}
            </div>
            <time>{event.time}</time>
            <strong>{event.title}</strong>
            <p>{event.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
