import { describe, expect, it } from "bun:test";
import { parseUsageOutput, locateOmpBinary } from "../src/fetcher";

describe("fetcher", () => {
  it("parses valid JSON string output", () => {
    const jsonStr = JSON.stringify({
      providers: [
        {
          provider: "google-antigravity",
          fetchedAt: 1792267857995,
          limits: []
        }
      ]
    });
    const parsed = parseUsageOutput(jsonStr);
    expect(parsed.providers.length).toBe(1);
    expect(parsed.providers[0].provider).toBe("google-antigravity");
  });

  it("extracts JSON even if CLI logs warnings before JSON output", () => {
    const noisyOutput = `AnnOS capture unavailable: source not connected\n{"providers": [{"provider": "openai-codex", "fetchedAt": 100, "limits": []}]}`;
    const parsed = parseUsageOutput(noisyOutput);
    expect(parsed.providers.length).toBe(1);
    expect(parsed.providers[0].provider).toBe("openai-codex");
  });

  it("throws clear error on malformed non-JSON output", () => {
    expect(() => parseUsageOutput("Fatal crash in omp")).toThrow("Failed to locate valid JSON");
  });

  it("respects OMP_BIN env var in locateOmpBinary", () => {
    const original = process.env.OMP_BIN;
    try {
      process.env.OMP_BIN = "/custom/path/to/omp";
      expect(locateOmpBinary()).toBe("/custom/path/to/omp");
    } finally {
      if (original) {
        process.env.OMP_BIN = original;
      } else {
        delete process.env.OMP_BIN;
      }
    }
  });
});
