import type { Model } from "@/data/models";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatRelease(model: Model): string {
  if (model.releaseDate) return formatIsoDate(model.releaseDate);
  if (model.releaseMonth) return formatMonth(model.releaseMonth);
  return "n/a";
}

/** Sort key. Month-only dates sort at mid-month and are never displayed as a day. */
export function releaseSortValue(model: Model): string | null {
  if (model.releaseDate) return model.releaseDate;
  if (model.releaseMonth) return `${model.releaseMonth}-15`;
  return null;
}

export function formatRate(value: number | null): string {
  if (value === null) return "n/a";
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 1 ? 2 : abs >= 0.01 ? 3 : 4;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  })}`;
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (value !== 0 && Math.abs(value) < 0.01) {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/** Per-request estimates can sit between one cent and a dollar. Keep enough digits to tell them apart. */
export function formatUsdExact(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  })}`;
}

export function formatTokens(value: number | null): string {
  if (value === null) return "n/a";
  if (value % 1000 === 0) {
    if (value >= 1_000_000 && value % 1_000_000 === 0) {
      return `${value / 1_000_000}M`;
    }
    if (value >= 1_000_000) {
      const millions = value / 1_000_000;
      return `${Number(millions.toFixed(2))}M`;
    }
    if (value >= 1000 && value % 1000 === 0) {
      return `${value / 1000}k`;
    }
  }
  return value.toLocaleString("en-US");
}

export function formatModalities(model: Model): string {
  if (!model.inputModalities && !model.outputModalities) return "n/a";
  const input = model.inputModalities?.join(", ") ?? "n/a";
  if (!model.outputModalities) return input;
  return `${input} → ${model.outputModalities.join(", ")}`;
}

export function statusLabel(status: Model["status"]): string {
  if (status === "preview") return "Preview";
  if (status === "legacy") return "Legacy";
  return "Active";
}
