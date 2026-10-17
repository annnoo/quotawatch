import type {
  NormalizedDashboardData,
  NormalizedProvider,
  NormalizedQuota,
  RawProvider,
  RawUsageOutput,
} from "./types";

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  if (hours > 0) {
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m`;
  }
  if (minutes > 0) {
    const remSeconds = seconds % 60;
    return `${minutes}m ${remSeconds}s`;
  }
  return `${Math.max(0, seconds)}s`;
}

export function formatResetCountdown(resetsAtMs: number, nowMs: number = Date.now()): string {
  const diff = resetsAtMs - nowMs;
  if (diff <= 0) {
    return "Reset imminent";
  }
  return formatDuration(diff);
}

export function getHealthColor(usedPercent: number, status?: string): 'green' | 'yellow' | 'red' {
  if (status === "exhausted" || usedPercent >= 80) {
    return "red";
  }
  if (usedPercent >= 50) {
    return "yellow";
  }
  return "green";
}

export function renderProgressBar(usedPercent: number, width: number = 20): string {
  const clamped = Math.max(0, Math.min(100, usedPercent));
  const filledChars = Math.round((clamped / 100) * width);
  const emptyChars = Math.max(0, width - filledChars);
  return "█".repeat(filledChars) + "░".repeat(emptyChars);
}

export function getProviderDisplayName(providerId: string): string {
  switch (providerId) {
    case "google-antigravity":
      return "Google Antigravity";
    case "openai-codex":
      return "OpenAI Codex";
    case "github-copilot":
      return "GitHub Copilot";
    default:
      return providerId
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
  }
}

export function normalizeProvider(p: RawProvider): NormalizedProvider {
  const quotas: NormalizedQuota[] = (p.limits || []).map((l) => {
    const used = l.amount.used;
    const color = getHealthColor(used, l.status);
    return {
      id: l.id,
      name: l.label,
      windowLabel: l.window.label,
      durationMs: l.window.durationMs,
      usedPercent: Math.round(used * 10) / 10,
      remainingPercent: Math.round((100 - used) * 10) / 10,
      resetsAtMs: l.window.resetsAt,
      status: l.status === "exhausted" ? "exhausted" : color === "yellow" ? "warning" : "ok",
      color,
      shared: Boolean(l.scope?.shared),
    };
  });

  let overallHealth: 'green' | 'yellow' | 'red' = 'green';
  if (quotas.some((q) => q.color === 'red')) {
    overallHealth = 'red';
  } else if (quotas.some((q) => q.color === 'yellow')) {
    overallHealth = 'yellow';
  }

  let resetCredits: { count: number; soonestExpiryDate?: string } | undefined;
  if (p.resetCredits && p.resetCredits.availableCount > 0) {
    const available = p.resetCredits.credits.filter((c) => c.status === "available");
    const sorted = [...available].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    resetCredits = {
      count: p.resetCredits.availableCount,
      soonestExpiryDate: sorted[0]?.expiresAt,
    };
  }

  return {
    id: p.provider,
    displayName: getProviderDisplayName(p.provider),
    email: p.metadata?.email,
    plan: p.metadata?.planType,
    fetchedAt: p.fetchedAt || Date.now(),
    quotas,
    resetCredits,
    overallHealth,
  };
}

export function normalizeUsageData(raw: RawUsageOutput): NormalizedDashboardData {
  return {
    fetchedAt: Date.now(),
    providers: (raw.providers || []).map(normalizeProvider),
  };
}
