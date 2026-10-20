export type ReadinessState = "ready" | "warning" | "blocked";

export interface ReadinessCheck {
  id: string;
  label: string;
  state: ReadinessState;
  detail: string;
}

export function getCountState(count: number | null | undefined, required = true): ReadinessState {
  if (count == null) return required ? "blocked" : "warning";
  if (count === 0) return required ? "warning" : "ready";
  return "ready";
}

export function getReadinessSummary(checks: ReadinessCheck[]) {
  const blocked = checks.filter((check) => check.state === "blocked").length;
  const warnings = checks.filter((check) => check.state === "warning").length;
  const ready = checks.filter((check) => check.state === "ready").length;
  const state: ReadinessState = blocked > 0 ? "blocked" : warnings > 0 ? "warning" : "ready";

  return {
    state,
    ready,
    warnings,
    blocked,
    total: checks.length,
  };
}

export function formatCount(count: number | null | undefined) {
  return count == null ? "Unavailable" : count.toLocaleString();
}
