import type { ModelStatus } from "@/data/models";
import { statusLabel } from "@/lib/format";

/** Renders the status label. Limited access and deprecated are badges so they stay visible in lists. */
export function StatusLabel({ status }: { status: ModelStatus }) {
  const label = statusLabel(status);
  if (status !== "limited" && status !== "deprecated") return label;
  const tone = status === "deprecated" ? "text-danger" : "text-ink";
  return (
    <span
      className={`inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium leading-5 ${tone}`}
    >
      {label}
    </span>
  );
}
