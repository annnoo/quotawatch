import chalk from "chalk";
import type {
  NormalizedDashboardData,
  NormalizedProvider,
  NormalizedQuota,
} from "../types.ts";
import { formatResetCountdown, renderProgressBar } from "../formatter.ts";

function colorizeBar(bar: string, color: "green" | "yellow" | "red"): string {
  switch (color) {
    case "red":
      return chalk.red(bar);
    case "yellow":
      return chalk.yellow(bar);
    case "green":
      return chalk.green(bar);
  }
}

function colorizePercent(
  percent: number,
  color: "green" | "yellow" | "red"
): string {
  const str = `${percent.toFixed(1)}%`.padStart(6, " ");
  switch (color) {
    case "red":
      return chalk.red.bold(str);
    case "yellow":
      return chalk.yellow.bold(str);
    case "green":
      return chalk.green(str);
  }
}

function renderQuotaLine(quota: NormalizedQuota): string {
  const label = `${quota.name} (${quota.windowLabel})`.padEnd(32, " ");
  const rawBar = renderProgressBar(quota.usedPercent, 20);
  const coloredBar = `[${colorizeBar(rawBar, quota.color)}]`;
  const pct = colorizePercent(quota.usedPercent, quota.color);
  const countdown = formatResetCountdown(quota.resetsAtMs);
  const resetText =
    countdown === "Reset imminent"
      ? chalk.dim("Reset imminent")
      : chalk.dim(`resets in ${countdown}`);
  const statusFlag =
    quota.status === "exhausted" ? chalk.bgRed.white.bold(" EXHAUSTED ") : "";

  return `    ● ${chalk.cyan(label)} ${coloredBar} ${pct} used · ${resetText}${statusFlag ? ` ${statusFlag}` : ""}`;
}

function renderProviderSection(p: NormalizedProvider): string {
  const emailPart = p.email ? chalk.dim(` (${p.email})`) : "";
  const planPart = p.plan ? chalk.magenta(` [${p.plan.toUpperCase()}]`) : "";
  const creditsPart = p.resetCredits
    ? chalk.blue(` · ✦ ${p.resetCredits.count} saved resets`)
    : "";

  const header = `  ${chalk.bold(p.displayName)}${planPart}${emailPart}${creditsPart}`;
  const lines = p.quotas.map(renderQuotaLine).join("\n");
  return `${header}\n${lines}`;
}

export function renderOneShotSummary(data: NormalizedDashboardData): string {
  const timeStr = new Date(data.fetchedAt).toLocaleTimeString();
  const title =
    chalk.bold.cyan("◈ QuotaWatch") +
    chalk.dim(` — AI Subscription Quotas (${timeStr})`);
  const divider = chalk.dim("─".repeat(70));

  if (data.providers.length === 0) {
    return `\n${title}\n${divider}\n\n  ${chalk.yellow("No authenticated AI subscriptions detected.")}\n\n${divider}\n`;
  }

  const sections = data.providers.map(renderProviderSection).join("\n\n");
  return `\n${title}\n${divider}\n\n${sections}\n\n${divider}\n`;
}

export function printOneShot(data: NormalizedDashboardData): void {
  console.log(renderOneShotSummary(data));
}
