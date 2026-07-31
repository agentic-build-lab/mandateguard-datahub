import type { CSSProperties } from "react";
import type { StepState } from "../types";
import { Icon } from "../icons";

export function WorkflowRail({
  workflow
}: {
  workflow: Array<{ label: string; state: StepState }>;
}) {
  const currentIndex = workflow.findIndex((step) => step.state === "current");
  const completedCount = workflow.filter((step) => step.state === "complete").length;
  const progressIndex = currentIndex >= 0 ? currentIndex : Math.max(0, completedCount - 1);
  const progress = workflow.length > 1
    ? `${Math.round((progressIndex / (workflow.length - 1)) * 100)}%`
    : "0%";

  return (
    <section
      className="workflow"
      aria-label="Control workflow"
      style={{ "--workflow-progress": progress } as CSSProperties}
    >
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
