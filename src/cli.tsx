#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { fetchDashboardData } from "./fetcher.ts";
import { printOneShot } from "./views/OneShotView.ts";
import { App } from "./App.tsx";

export function parseInterval(arg?: string): number {
  if (!arg) {
    return 90;
  }
  if (arg.endsWith("m")) {
    const mins = parseFloat(arg.slice(0, -1));
    return isNaN(mins) ? 90 : Math.max(10, Math.round(mins * 60));
  }
  if (arg.endsWith("s")) {
    const secs = parseFloat(arg.slice(0, -1));
    return isNaN(secs) ? 90 : Math.max(10, Math.round(secs));
  }
  const parsed = parseInt(arg, 10);
  return isNaN(parsed) ? 90 : Math.max(10, parsed);
}

export function printHelp(): void {
  console.log(`
◈ QuotaWatch — AI Subscription Quota & Usage Monitor

USAGE:
  quotawatch [OPTIONS]

OPTIONS:
  -w, --watch            Launch interactive auto-refreshing React/Ink TUI
  -i, --interval <dur>   Polling interval in seconds or minutes (e.g. 90s, 2m) [default: 90s]
  -j, --json             Print normalized JSON snapshot to stdout and exit
  -h, --help             Show this help screen
  -v, --version          Show version

KEYBINDINGS (in Watch Mode):
  Tab / Shift+Tab        Cycle between tabs (Overview, Antigravity, Codex)
  1, 2, 3                Switch directly to tab
  r                      Force immediate quota refresh
  q, Esc, Ctrl+C         Quit QuotaWatch
`);
}

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log("quotawatch v1.0.0");
    process.exit(0);
  }

  if (args.includes("-j") || args.includes("--json")) {
    try {
      const data = await fetchDashboardData();
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    } catch (err) {
      console.error("Error fetching usage data:", err);
      process.exit(1);
    }
  }

  const isWatch = args.includes("-w") || args.includes("--watch");
  let intervalSec = 90;
  const intervalIdx = args.findIndex((a) => a === "-i" || a === "--interval");
  if (intervalIdx !== -1 && args[intervalIdx + 1]) {
    intervalSec = parseInterval(args[intervalIdx + 1]);
  }

  try {
    const initialData = await fetchDashboardData();

    if (!isWatch) {
      printOneShot(initialData);
      process.exit(0);
    }

    // Launch Ink interactive TUI
    render(<App initialData={initialData} pollIntervalSeconds={intervalSec} />);
  } catch (err: unknown) {
    console.error("QuotaWatch error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

// Only invoke automatically when run as the main script
if (import.meta.main) {
  main();
}
