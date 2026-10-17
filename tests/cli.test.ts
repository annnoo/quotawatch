import { describe, it, expect } from "bun:test";
import { parseInterval } from "../src/cli.tsx";

describe("cli argument parsing", () => {
  it("defaults to 90 seconds if arg is omitted or invalid", () => {
    expect(parseInterval(undefined)).toBe(90);
    expect(parseInterval("")).toBe(90);
    expect(parseInterval("invalid")).toBe(90);
  });

  it("parses seconds format (e.g. 30s, 120s)", () => {
    expect(parseInterval("30s")).toBe(30);
    expect(parseInterval("120s")).toBe(120);
  });

  it("parses minutes format (e.g. 2m, 1.5m)", () => {
    expect(parseInterval("2m")).toBe(120);
    expect(parseInterval("1.5m")).toBe(90);
  });

  it("enforces minimum interval of 10s", () => {
    expect(parseInterval("5s")).toBe(10);
    expect(parseInterval("0.1m")).toBe(10);
    expect(parseInterval("2")).toBe(10);
  });

  it("parses plain numeric seconds", () => {
    expect(parseInterval("45")).toBe(45);
  });
});
