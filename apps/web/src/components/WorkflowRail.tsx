import type { StepState } from "../types";
import { Icon } from "../icons";

export function WorkflowRail({
  workflow
}: {
  workflow: Array<{ label: string; state: StepState }>;
}) {
  return (
    <section className="workflow" aria-label="Control workflow">
      <div className="workflow-line" />
      {workflow.map((step, index) => (
        <div className={`workflow-step ${step.state}`} key={step.label}>
          <span className="step-node">
            {step.state === "complete" ? <Icon name="check" /> : index + 1}
          </span>
          <strong>{step.label}</strong>
          <small>
            {step.state === "complete"
              ? "Completed"
              : step.state === "current"
                ? "In progress"
                : "Pending"}
          </small>
        </div>
      ))}
    </section>
  );
}
