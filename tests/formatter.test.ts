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
    expect(normalized.providers[0].quotas[0].name).toBe("5 hours");
    expect(normalized.providers[0].quotas[0].usedPercent).toBe(15);
    expect(normalized.providers[0].quotas[0].color).toBe("green");
  });
});
