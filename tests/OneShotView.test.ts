import { describe, expect, it, spyOn } from "bun:test";
import { renderOneShotSummary, printOneShot } from "../src/views/OneShotView";
import type { NormalizedDashboardData } from "../src/types";

describe("OneShotView", () => {
  it("formats summary output with provider headings and color tags", () => {
    const mockData: NormalizedDashboardData = {
      fetchedAt: Date.now(),
      providers: [
        {
          id: "google-antigravity",
          displayName: "Google Antigravity",
          email: "user@googlemail.com",
          fetchedAt: Date.now(),
          quotas: [
            {
              id: "gemini-5h",
              name: "Gemini",
              windowLabel: "5 Hour",
              durationMs: 18000000,
              usedPercent: 0.6,
              remainingPercent: 99.4,
              resetsAtMs: Date.now() + 18000000,
              status: "ok",
              color: "green",
            }
          ],
          overallHealth: "green"
        }
      ]
    };

    const output = renderOneShotSummary(mockData);
    expect(output).toContain("QuotaWatch");
    expect(output).toContain("Google Antigravity");
    expect(output).toContain("Gemini (5 Hour)");
    expect(output).toContain("0.6% used");
  });

  it("handles empty providers gracefully", () => {
    const mockData: NormalizedDashboardData = {
      fetchedAt: Date.now(),
      providers: []
    };

    const output = renderOneShotSummary(mockData);
    expect(output).toContain("QuotaWatch");
    expect(output).toContain("No authenticated AI subscriptions detected.");
  });

  it("renders plan, reset credits, and exhausted status flags", () => {
    const mockData: NormalizedDashboardData = {
      fetchedAt: Date.now(),
      providers: [
        {
          id: "google-antigravity",
          displayName: "Google Antigravity",
          email: "user@googlemail.com",
          plan: "pro",
          resetCredits: {
            count: 3,
            soonestExpiryDate: "2026-10-20T00:00:00Z"
          },
          fetchedAt: Date.now(),
          quotas: [
            {
              id: "gemini-5h",
              name: "Gemini",
              windowLabel: "5 Hour",
              durationMs: 18000000,
              usedPercent: 100,
              remainingPercent: 0,
              resetsAtMs: Date.now() + 3600000,
              status: "exhausted",
              color: "red",
            },
            {
              id: "claude-week",
              name: "Claude",
              windowLabel: "Weekly",
              durationMs: 604800000,
              usedPercent: 65.5,
              remainingPercent: 34.5,
              resetsAtMs: Date.now() + 86400000,
              status: "warning",
              color: "yellow",
            }
          ],
          overallHealth: "red"
        }
      ]
    };

    const output = renderOneShotSummary(mockData);
    expect(output).toContain("[PRO]");
    expect(output).toContain("3 saved resets");
    expect(output).toContain("EXHAUSTED");
    expect(output).toContain("65.5% used");
  });

  it("prints one shot summary to console", () => {
    const spy = spyOn(console, "log").mockImplementation(() => {});
    const mockData: NormalizedDashboardData = {
      fetchedAt: Date.now(),
      providers: []
    };

    printOneShot(mockData);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
