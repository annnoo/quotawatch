import { describe, expect, it } from "bun:test";
import {
  formatDuration,
  formatResetCountdown,
  getHealthColor,
  renderProgressBar,
  normalizeUsageData,
} from "../src/formatter";
import type { RawUsageOutput } from "../src/types";

describe("formatter", () => {
  it("formats countdown accurately", () => {
    const now = 1000000;
    expect(formatResetCountdown(now + 45000, now)).toBe("45s");
    expect(formatResetCountdown(now + 3600000 * 2 + 60000 * 15, now)).toBe("2h 15m");
    expect(formatResetCountdown(now + 86400000 * 3 + 3600000 * 4, now)).toBe("3d 4h");
    expect(formatResetCountdown(now - 1000, now)).toBe("Reset imminent");
  });

  it("determines health color according to thresholds", () => {
    expect(getHealthColor(30, "ok")).toBe("green");
    expect(getHealthColor(50, "ok")).toBe("yellow");
    expect(getHealthColor(79.9, "ok")).toBe("yellow");
    expect(getHealthColor(80, "ok")).toBe("red");
    expect(getHealthColor(10, "exhausted")).toBe("red");
  });

  it("renders progress bar with correct fill ratio", () => {
    const bar0 = renderProgressBar(0, 10);
    expect(bar0).toBe("░░░░░░░░░░");
    const bar50 = renderProgressBar(50, 10);
    expect(bar50).toBe("█████░░░░░");
    const bar100 = renderProgressBar(100, 10);
    expect(bar100).toBe("██████████");
  });

  it("clamps progress bar boundaries correctly", () => {
    const barNeg = renderProgressBar(-5, 10);
    expect(barNeg).toBe("░░░░░░░░░░");
    const barOver = renderProgressBar(150, 10);
    expect(barOver).toBe("██████████");
  });

  it("normalizes raw usage output cleanly", () => {
    const sampleRaw: RawUsageOutput = {
      providers: [
        {
          provider: "openai-codex",
          fetchedAt: 1700000000000,
          limits: [
            {
              id: "codex-5h",
              label: "5 hours",
              scope: { provider: "openai-codex", windowId: "5h" },
              window: { id: "5h", label: "5 hours", durationMs: 18000000, resetsAt: 1700018000000 },
              amount: { used: 15, limit: 100, remaining: 85, usedFraction: 0.15, unit: "percent" },
              status: "ok"
            }
          ],
          metadata: { planType: "plus", email: "user@test.com" }
        }
      ]
    };

    const normalized = normalizeUsageData(sampleRaw);
    expect(normalized.providers.length).toBe(1);
    expect(normalized.providers[0].displayName).toBe("OpenAI Codex");
    expect(normalized.providers[0].quotas[0].name).toBe("Codex");
    expect(normalized.providers[0].quotas[0].usedPercent).toBe(15);
    expect(normalized.providers[0].quotas[0].color).toBe("green");
  });

  it("supports raw.reports payload structure", () => {
    const sampleRaw: RawUsageOutput = {
      reports: [
        {
          provider: "google-antigravity",
          fetchedAt: 1700000000000,
          limits: [
            {
              id: "gemini-weekly",
              label: "Gemini",
              scope: { provider: "google-antigravity", windowId: "weekly" },
              window: { id: "weekly", label: "Weekly", durationMs: 604800000, resetsAt: 1700060000000 },
              amount: { used: 40, limit: 100, remaining: 60, usedFraction: 0.4, unit: "percent" },
              status: "ok"
            }
          ]
        }
      ]
    };

    const normalized = normalizeUsageData(sampleRaw);
    expect(normalized.providers.length).toBe(1);
    expect(normalized.providers[0].displayName).toBe("Google Antigravity");
    expect(normalized.providers[0].quotas[0].name).toBe("Gemini");
    expect(normalized.providers[0].quotas[0].usedPercent).toBe(40);
  });

  it("deduplicates shared groups and identical quotas defensively", () => {
    const sampleRaw: RawUsageOutput = {
      providers: [
        {
          provider: "google-antigravity",
          fetchedAt: 1700000000000,
          resetCredits: {
            availableCount: 1
          },
          limits: [
            {
              id: "anthropic-shared",
              label: "Claude & GPT (shared)",
              scope: { provider: "google-antigravity", sharedGroup: "3p-weekly:weekly" },
              window: { id: "weekly", label: "Weekly", durationMs: 604800000, resetsAt: 1700060000000 },
              amount: { used: 50, limit: 100, remaining: 50, usedFraction: 0.5, unit: "percent" },
              status: "ok"
            },
            {
              id: "openai-shared",
              label: "Claude & GPT (shared)",
              scope: { provider: "google-antigravity", sharedGroup: "3p-weekly:weekly" },
              window: { id: "weekly", label: "Weekly", durationMs: 604800000, resetsAt: 1700060000000 },
              amount: { used: 50, limit: 100, remaining: 50, usedFraction: 0.5, unit: "percent" },
              status: "ok"
            },
            {
              id: "duplicate-without-group",
              label: "Gemini",
              scope: { provider: "google-antigravity" },
              window: { id: "weekly", label: "Weekly", durationMs: 604800000, resetsAt: 1700060000000 },
              amount: { used: 30, limit: 100, remaining: 70, usedFraction: 0.3, unit: "percent" },
              status: "ok"
            },
            {
              id: "duplicate-without-group-2",
              label: "Gemini",
              scope: { provider: "google-antigravity" },
              window: { id: "weekly", label: "Weekly", durationMs: 604800000, resetsAt: 1700060000000 },
              amount: { used: 30, limit: 100, remaining: 70, usedFraction: 0.3, unit: "percent" },
              status: "ok"
            }
          ]
        }
      ]
    };

    const normalized = normalizeUsageData(sampleRaw);
    expect(normalized.providers[0].quotas.length).toBe(2);
    expect(normalized.providers[0].quotas[0].id).toBe("anthropic-shared");
    expect(normalized.providers[0].quotas[1].id).toBe("duplicate-without-group");
    expect(normalized.providers[0].resetCredits?.count).toBe(1);
    expect(normalized.providers[0].resetCredits?.soonestExpiryDate).toBeUndefined();
  });
});
