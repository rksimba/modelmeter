import type { ModelStatus } from "@/data/models";
import { statusLabel } from "@/lib/format";

/** Renders the status label. Limited access is a badge so it stays visible in lists. */
export function StatusLabel({ status }: { status: ModelStatus }) {
  const label = statusLabel(status);
  if (status !== "limited") return label;
  return (
    <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium leading-5 text-ink">
      {label}
    </span>
  );
}
