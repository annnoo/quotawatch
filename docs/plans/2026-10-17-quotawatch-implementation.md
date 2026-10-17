# QuotaWatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and install a standalone terminal application and auto-refreshing React/Ink dashboard (`quotawatch`) for tracking Google Antigravity and OpenAI Codex subscription quotas, remaining capacities, and reset countdowns.

**Architecture:** A TypeScript/Bun project structured with decoupled modules: a data fetcher that queries `omp usage --json`, a formatting & calculation engine, a one-shot ANSI renderer, and an interactive full-screen React/Ink TUI watch mode. The app compiles/bundles to a self-contained executable symlinked into `~/.local/bin/quotawatch`.

**Tech Stack:** TypeScript, Bun (runtime & test runner), React, Ink (`ink`), Chalk.

**Spec:** `/home/anno/Code/agents/quotawatch/docs/specs/2026-10-17-quotawatch-design.md`

## Global Constraints

- Project root: `/home/anno/Code/agents/quotawatch`
- Global binary path: `/home/anno/.local/bin/quotawatch`
- Package manager & runtime: `/home/anno/.bun/bin/bun`
- Color thresholds: `< 50%` Green, `50% - 79.9%` Yellow, `≥ 80%` or exhausted Red
- Data source: `omp usage --json --no-extensions`

---

### Task 1: Project Scaffolding & Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Interfaces:**
- Consumes: None
- Produces: Bun project dependencies (`ink`, `react`, `chalk`) and build scripts.

- [ ] **Step 1: Create package.json with dependencies**

```json
{
  "name": "quotawatch",
  "version": "1.0.0",
  "description": "Terminal monitor for AI subscription usage & quota resets",
  "main": "src/cli.tsx",
  "type": "module",
  "scripts": {
    "start": "bun run src/cli.tsx",
    "test": "bun test",
    "build": "bun build src/cli.tsx --target=bun --outfile=dist/quotawatch"
  },
  "dependencies": {
    "chalk": "^5.4.1",
    "ink": "^5.1.0",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.18",
    "bun-types": "latest"
  }
}
```

- [ ] **Step 2: Create tsconfig.json and .gitignore**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "module": "esnext",
    "target": "esnext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "composite": true,
    "strict": true,
    "downlevelIteration": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "types": ["bun-types"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

`.gitignore`:
```text
node_modules/
dist/
.DS_Store
```

- [ ] **Step 3: Install dependencies using Bun**

Run: `/home/anno/.bun/bin/bun install`  
Expected: `Saved lockfile. Successfully installed dependencies`

- [ ] **Step 4: Verify Bun test runner is functional**

Run: `/home/anno/.bun/bin/bun test`  
Expected: `0 pass, 0 fail`

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json .gitignore bun.lock*
git commit -m "chore: scaffold quotawatch project with bun, react, and ink"
```

---

### Task 2: Core Data Types & Formatting Engine

**Files:**
- Create: `src/types.ts`
- Create: `src/formatter.ts`
- Test: `tests/formatter.test.ts`

**Interfaces:**
- Consumes: Raw JSON structures from `omp usage --json`.
- Produces:
  - `formatDuration(ms: number): string`
  - `formatResetCountdown(resetsAtMs: number, nowMs?: number): string`
  - `getHealthColor(usedPercent: number, status?: string): 'green' | 'yellow' | 'red'`
  - `renderProgressBar(usedPercent: number, width?: number): string`
  - `normalizeUsageData(raw: RawUsageOutput): NormalizedDashboardData`

- [ ] **Step 1: Write the failing tests for formatting & normalization**

`tests/formatter.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `/home/anno/.bun/bin/bun test tests/formatter.test.ts`  
Expected: FAIL (Cannot find module `../src/formatter`)

- [ ] **Step 3: Implement src/types.ts and src/formatter.ts**

`src/types.ts`:
```typescript
export interface RawQuotaLimit {
  id: string;
  label: string;
  scope?: {
    provider?: string;
    windowId?: string;
    shared?: boolean;
    sharedGroup?: string;
  };
  window: {
    id: string;
    label: string;
    durationMs: number;
    resetsAt: number;
  };
  amount: {
    used: number;
    limit: number;
    remaining: number;
    usedFraction: number;
    remainingFraction?: number;
    unit: string;
  };
  status: 'ok' | 'exhausted' | string;
}

export interface RawProvider {
  provider: string;
  fetchedAt: number;
  limits: RawQuotaLimit[];
  resetCredits?: {
    availableCount: number;
    credits: Array<{
      grantedAt: string;
      expiresAt: string;
      status: string;
    }>;
  };
  metadata?: {
    planType?: string;
    allowed?: boolean;
    limitReached?: boolean;
    email?: string;
    projectId?: string;
    [key: string]: unknown;
  };
}

export interface RawUsageOutput {
  providers: RawProvider[];
  accountsWithoutUsage?: unknown[];
  disabledCredentials?: unknown[];
  capacity?: Record<string, unknown[]>;
}

export interface NormalizedQuota {
  id: string;
  name: string;
  windowLabel: string;
  durationMs: number;
  usedPercent: number;
  remainingPercent: number;
  resetsAtMs: number;
  status: 'ok' | 'exhausted' | 'warning';
  color: 'green' | 'yellow' | 'red';
  shared?: boolean;
}

export interface NormalizedProvider {
  id: string;
  displayName: string;
  email?: string;
  plan?: string;
  fetchedAt: number;
  quotas: NormalizedQuota[];
  resetCredits?: {
    count: number;
    soonestExpiryDate?: string;
  };
  overallHealth: 'green' | 'yellow' | 'red';
}

export interface NormalizedDashboardData {
  fetchedAt: number;
  providers: NormalizedProvider[];
}
```

`src/formatter.ts`:
```typescript
import type {
  NormalizedDashboardData,
  NormalizedProvider,
  NormalizedQuota,
  RawProvider,
  RawUsageOutput,
} from "./types.ts";

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
  const quotas: NormalizedQuota[] = p.limits.map((l) => {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `/home/anno/.bun/bin/bun test tests/formatter.test.ts`  
Expected: `4 pass, 0 fail`

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/formatter.ts tests/formatter.test.ts
git commit -m "feat: implement data types, formatting helpers and tests"
```

---

### Task 3: Data Fetching Engine

**Files:**
- Create: `src/fetcher.ts`
- Test: `tests/fetcher.test.ts`

**Interfaces:**
- Consumes: `omp usage --json --no-extensions` from system PATH or `/home/anno/.bun/bin/omp`.
- Produces:
  - `fetchUsageRaw(options?: { timeoutMs?: number; ompPath?: string }): Promise<RawUsageOutput>`
  - `fetchDashboardData(options?: { timeoutMs?: number }): Promise<NormalizedDashboardData>`

- [ ] **Step 1: Write test for fetcher error handling and parsing**

`tests/fetcher.test.ts`:
```typescript
import { describe, expect, it } from "bun:test";
import { parseUsageOutput } from "../src/fetcher";

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `/home/anno/.bun/bin/bun test tests/fetcher.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement src/fetcher.ts**

`src/fetcher.ts`:
```typescript
import { spawn } from "node:child_process";
import type { NormalizedDashboardData, RawUsageOutput } from "./types.ts";
import { normalizeUsageData } from "./formatter.ts";

export function parseUsageOutput(stdout: string): RawUsageOutput {
  const jsonStart = stdout.indexOf("{");
  const jsonEnd = stdout.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error(`Failed to locate valid JSON in CLI output: ${stdout.slice(0, 120)}`);
  }
  const cleanJson = stdout.slice(jsonStart, jsonEnd + 1);
  return JSON.parse(cleanJson) as RawUsageOutput;
}

export function locateOmpBinary(): string {
  if (process.env.OMP_BIN) return process.env.OMP_BIN;
  return "/home/anno/.bun/bin/omp";
}

export async function fetchUsageRaw(options: { timeoutMs?: number; ompPath?: string } = {}): Promise<RawUsageOutput> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const binary = options.ompPath ?? locateOmpBinary();

  return new Promise((resolve, reject) => {
    const child = spawn(binary, ["usage", "--json", "--no-extensions"], {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Timeout: 'omp usage' exceeded ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to launch '${binary}': ${err.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !stdout.includes("{")) {
        reject(new Error(`'omp usage' failed with code ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        const parsed = parseUsageOutput(stdout);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function fetchDashboardData(options?: { timeoutMs?: number }): Promise<NormalizedDashboardData> {
  const raw = await fetchUsageRaw(options);
  return normalizeUsageData(raw);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `/home/anno/.bun/bin/bun test tests/fetcher.test.ts`  
Expected: `3 pass, 0 fail`

- [ ] **Step 5: Commit**

```bash
git add src/fetcher.ts tests/fetcher.test.ts
git commit -m "feat: implement data fetching engine and JSON extraction"
```

---

### Task 4: One-Shot Terminal Rundown View

**Files:**
- Create: `src/views/OneShotView.ts`
- Test: `tests/OneShotView.test.ts`

**Interfaces:**
- Consumes: `NormalizedDashboardData` from `src/types.ts`.
- Produces: `renderOneShotSummary(data: NormalizedDashboardData): string` and `printOneShot(data: NormalizedDashboardData): void`.

- [ ] **Step 1: Write test for one-shot rendering**

`tests/OneShotView.test.ts`:
```typescript
import { describe, expect, it } from "bun:test";
import { renderOneShotSummary } from "../src/views/OneShotView";
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `/home/anno/.bun/bin/bun test tests/OneShotView.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement src/views/OneShotView.ts**

`src/views/OneShotView.ts`:
```typescript
import chalk from "chalk";
import type { NormalizedDashboardData, NormalizedProvider, NormalizedQuota } from "../types.ts";
import { formatResetCountdown, renderProgressBar } from "../formatter.ts";

function colorizeBar(bar: string, color: 'green' | 'yellow' | 'red'): string {
  switch (color) {
    case "red":
      return chalk.red(bar);
    case "yellow":
      return chalk.yellow(bar);
    case "green":
      return chalk.green(bar);
  }
}

function colorizePercent(percent: number, color: 'green' | 'yellow' | 'red'): string {
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
  const resetText = chalk.dim(`resets in ${countdown}`);
  const statusFlag = quota.status === "exhausted" ? chalk.bgRed.white.bold(" EXHAUSTED ") : "";

  return `    ● ${chalk.cyan(label)} ${coloredBar} ${pct} used · ${resetText} ${statusFlag}`;
}

function renderProviderSection(p: NormalizedProvider): string {
  const emailPart = p.email ? chalk.dim(` (${p.email})`) : "";
  const planPart = p.plan ? chalk.magenta(` [${p.plan.toUpperCase()}]`) : "";
  const creditsPart = p.resetCredits ? chalk.blue(` · ✦ ${p.resetCredits.count} saved resets`) : "";

  const header = `  ${chalk.bold(p.displayName)}${planPart}${emailPart}${creditsPart}`;
  const lines = p.quotas.map(renderQuotaLine).join("\n");
  return `${header}\n${lines}`;
}

export function renderOneShotSummary(data: NormalizedDashboardData): string {
  const timeStr = new Date(data.fetchedAt).toLocaleTimeString();
  const title = chalk.bold.cyan("◈ QuotaWatch") + chalk.dim(` — AI Subscription Quotas (${timeStr})`);
  const divider = chalk.dim("─".repeat(70));

  if (data.providers.length === 0) {
    return `${title}\n${divider}\n  ${chalk.yellow("No authenticated AI subscriptions detected.")}\n`;
  }

  const sections = data.providers.map(renderProviderSection).join("\n\n");
  return `\n${title}\n${divider}\n\n${sections}\n\n${divider}\n`;
}

export function printOneShot(data: NormalizedDashboardData): void {
  console.log(renderOneShotSummary(data));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `/home/anno/.bun/bin/bun test tests/OneShotView.test.ts`  
Expected: `1 pass, 0 fail`

- [ ] **Step 5: Commit**

```bash
git add src/views/OneShotView.ts tests/OneShotView.test.ts
git commit -m "feat: implement one-shot ANSI summary view"
```

---

### Task 5: Interactive React/Ink TUI Components

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/ProgressBar.tsx`
- Create: `src/components/OverviewTab.tsx`
- Create: `src/components/AntigravityTab.tsx`
- Create: `src/components/CodexTab.tsx`
- Create: `src/components/Footer.tsx`
- Create: `src/App.tsx`

**Interfaces:**
- Consumes: `NormalizedDashboardData` and auto-refresh states.
- Produces: Top-level `<App />` component responsive to keyboard events (`Tab`, `1-3`, `r`, `q`).

- [ ] **Step 1: Implement Header.tsx and ProgressBar.tsx**

`src/components/ProgressBar.tsx`:
```tsx
import React from "react";
import { Text } from "ink";
import { renderProgressBar } from "../formatter.ts";

interface Props {
  usedPercent: number;
  color: 'green' | 'yellow' | 'red';
  width?: number;
}

export const ProgressBar: React.FC<Props> = ({ usedPercent, color, width = 20 }) => {
  const bar = renderProgressBar(usedPercent, width);
  return (
    <Text>
      [<Text color={color}>{bar}</Text>]
    </Text>
  );
};
```

`src/components/Header.tsx`:
```tsx
import React from "react";
import { Box, Text } from "ink";

interface Props {
  activeTab: number;
  lastUpdated: number;
  nextPollSeconds: number;
  isSyncing: boolean;
  clockTime: string;
}

export const Header: React.FC<Props> = ({
  activeTab,
  lastUpdated,
  nextPollSeconds,
  isSyncing,
  clockTime,
}) => {
  const elapsed = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));
  const tabs = ["1: Overview", "2: Antigravity", "3: Codex"];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          ◈ QuotaWatch TUI
        </Text>
        <Text color="gray">{clockTime}</Text>
        <Text>
          {isSyncing ? (
            <Text bold color="yellow">
              ● Syncing...
            </Text>
          ) : (
            <Text color="dim">
              Updated {elapsed}s ago · Next in {nextPollSeconds}s
            </Text>
          )}
        </Text>
      </Box>

      <Box marginTop={1} gap={2}>
        {tabs.map((name, idx) => {
          const isSelected = activeTab === idx;
          return (
            <Text
              key={name}
              bold={isSelected}
              color={isSelected ? "black" : "cyan"}
              backgroundColor={isSelected ? "cyan" : undefined}
            >
              {" "}{name}{" "}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
};
```

- [ ] **Step 2: Implement OverviewTab.tsx, AntigravityTab.tsx, and CodexTab.tsx**

`src/components/OverviewTab.tsx`:
```tsx
import React from "react";
import { Box, Text } from "ink";
import type { NormalizedDashboardData } from "../types.ts";
import { ProgressBar } from "./ProgressBar.tsx";
import { formatResetCountdown } from "../formatter.ts";

export const OverviewTab: React.FC<{ data: NormalizedDashboardData; nowMs: number }> = ({
  data,
  nowMs,
}) => {
  return (
    <Box flexDirection="column" gap={1} marginTop={1}>
      {data.providers.map((p) => (
        <Box key={p.id} flexDirection="column" borderStyle="single" borderColor={p.overallHealth} paddingX={1}>
          <Box justifyContent="space-between">
            <Text bold color="white">
              {p.displayName} {p.email && <Text color="dim">({p.email})</Text>}
            </Text>
            <Text bold color={p.overallHealth}>
              Health: {p.overallHealth.toUpperCase()}
            </Text>
          </Box>
          <Box flexDirection="column" marginTop={1}>
            {p.quotas.map((q) => {
              const countdown = formatResetCountdown(q.resetsAtMs, nowMs);
              return (
                <Box key={q.id} justifyContent="space-between">
                  <Box width={34}>
                    <Text color="cyan">● {q.name} ({q.windowLabel})</Text>
                  </Box>
                  <Box width={26}>
                    <ProgressBar usedPercent={q.usedPercent} color={q.color} width={20} />
                  </Box>
                  <Box width={12} justifyContent="flex-end">
                    <Text bold color={q.color}>
                      {q.usedPercent.toFixed(1)}%
                    </Text>
                  </Box>
                  <Box width={22} justifyContent="flex-end">
                    <Text color="gray">resets in {countdown}</Text>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
};
```

`src/components/AntigravityTab.tsx`:
```tsx
import React from "react";
import { Box, Text } from "ink";
import type { NormalizedDashboardData } from "../types.ts";
import { ProgressBar } from "./ProgressBar.tsx";
import { formatResetCountdown } from "../formatter.ts";

export const AntigravityTab: React.FC<{ data: NormalizedDashboardData; nowMs: number }> = ({
  data,
  nowMs,
}) => {
  const provider = data.providers.find((p) => p.id === "google-antigravity");
  if (!provider) {
    return (
      <Box marginTop={1} padding={1} borderStyle="single" borderColor="gray">
        <Text color="yellow">Google Antigravity is not connected.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1} marginTop={1}>
      <Text bold color="white">
        Google Antigravity — Detailed Breakdown
      </Text>
      <Text color="dim">Account: {provider.email || "N/A"}</Text>

      <Box flexDirection="column" marginTop={1} gap={1}>
        {provider.quotas.map((q) => (
          <Box key={q.id} flexDirection="column">
            <Box justifyContent="space-between">
              <Text bold color="cyan">{q.name} · {q.windowLabel}</Text>
              <Text color="gray">Resets: {formatResetCountdown(q.resetsAtMs, nowMs)}</Text>
            </Box>
            <Box gap={2} alignItems="center">
              <ProgressBar usedPercent={q.usedPercent} color={q.color} width={30} />
              <Text bold color={q.color}>{q.usedPercent.toFixed(1)}% used</Text>
              <Text color="dim">({q.remainingPercent.toFixed(1)}% remaining)</Text>
              {q.status === "exhausted" && <Text bold color="red">[EXHAUSTED]</Text>}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
```

`src/components/CodexTab.tsx`:
```tsx
import React from "react";
import { Box, Text } from "ink";
import type { NormalizedDashboardData } from "../types.ts";
import { ProgressBar } from "./ProgressBar.tsx";
import { formatResetCountdown } from "../formatter.ts";

export const CodexTab: React.FC<{ data: NormalizedDashboardData; nowMs: number }> = ({
  data,
  nowMs,
}) => {
  const provider = data.providers.find((p) => p.id === "openai-codex");
  if (!provider) {
    return (
      <Box marginTop={1} padding={1} borderStyle="single" borderColor="gray">
        <Text color="yellow">OpenAI Codex is not connected.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="magenta" paddingX={1} marginTop={1}>
      <Box justifyContent="space-between">
        <Text bold color="white">OpenAI Codex — Detailed Breakdown</Text>
        <Text color="magenta">Plan: {provider.plan?.toUpperCase() || "PLUS"}</Text>
      </Box>
      <Text color="dim">Account: {provider.email || "N/A"}</Text>

      {provider.resetCredits && (
        <Box marginTop={1} paddingX={1} backgroundColor="gray">
          <Text color="yellow" bold>✦ Saved Reset Credits: {provider.resetCredits.count}</Text>
          {provider.resetCredits.soonestExpiryDate && (
            <Text color="white"> (Soonest expires: {new Date(provider.resetCredits.soonestExpiryDate).toLocaleDateString()})</Text>
          )}
        </Box>
      )}

      <Box flexDirection="column" marginTop={1} gap={1}>
        {provider.quotas.map((q) => (
          <Box key={q.id} flexDirection="column">
            <Box justifyContent="space-between">
              <Text bold color="cyan">{q.name} · {q.windowLabel}</Text>
              <Text color="gray">Resets: {formatResetCountdown(q.resetsAtMs, nowMs)}</Text>
            </Box>
            <Box gap={2} alignItems="center">
              <ProgressBar usedPercent={q.usedPercent} color={q.color} width={30} />
              <Text bold color={q.color}>{q.usedPercent.toFixed(1)}% used</Text>
              <Text color="dim">({q.remainingPercent.toFixed(1)}% remaining)</Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
```

- [ ] **Step 3: Implement Footer.tsx and App.tsx**

`src/components/Footer.tsx`:
```tsx
import React from "react";
import { Box, Text } from "ink";

interface Props {
  errorMsg?: string;
}

export const Footer: React.FC<Props> = ({ errorMsg }) => {
  return (
    <Box flexDirection="column" marginTop={1}>
      {errorMsg && (
        <Box marginBottom={1}>
          <Text bold color="red">⚠ Error: {errorMsg}</Text>
        </Box>
      )}
      <Box justifyContent="space-between" borderStyle="round" borderColor="gray" paddingX={1}>
        <Text color="dim">
          <Text bold color="white">[Tab]</Text> Next Tab ·{" "}
          <Text bold color="white">[1-3]</Text> Direct Tab ·{" "}
          <Text bold color="white">[r]</Text> Refresh Now ·{" "}
          <Text bold color="white">[q/Esc]</Text> Quit
        </Text>
      </Box>
    </Box>
  );
};
```

`src/App.tsx`:
```tsx
import React, { useState, useEffect, useCallback } from "react";
import { Box, useApp, useInput } from "ink";
import type { NormalizedDashboardData } from "./types.ts";
import { fetchDashboardData } from "./fetcher.ts";
import { Header } from "./components/Header.tsx";
import { OverviewTab } from "./components/OverviewTab.tsx";
import { AntigravityTab } from "./components/AntigravityTab.tsx";
import { CodexTab } from "./components/CodexTab.tsx";
import { Footer } from "./components/Footer.tsx";

interface Props {
  initialData: NormalizedDashboardData;
  pollIntervalSeconds: number;
}

export const App: React.FC<Props> = ({ initialData, pollIntervalSeconds }) => {
  const { exit } = useApp();
  const [data, setData] = useState<NormalizedDashboardData>(initialData);
  const [activeTab, setActiveTab] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [nextPollSeconds, setNextPollSeconds] = useState(pollIntervalSeconds);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [nowMs, setNowMs] = useState(Date.now());

  const triggerRefresh = useCallback(async () => {
    setIsSyncing(true);
    setErrorMsg(undefined);
    try {
      const refreshed = await fetchDashboardData();
      setData(refreshed);
      setLastUpdated(Date.now());
      setNextPollSeconds(pollIntervalSeconds);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSyncing(false);
    }
  }, [pollIntervalSeconds]);

  // 1-second ticker for countdowns and local clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
      setNextPollSeconds((prev) => {
        if (prev <= 1) {
          triggerRefresh();
          return pollIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pollIntervalSeconds, triggerRefresh]);

  // Keybindings
  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
    } else if (input === "r") {
      triggerRefresh();
    } else if (key.tab) {
      setActiveTab((prev) => (prev + 1) % 3);
    } else if (input === "1") {
      setActiveTab(0);
    } else if (input === "2") {
      setActiveTab(1);
    } else if (input === "3") {
      setActiveTab(2);
    }
  });

  const clockTime = new Date(nowMs).toLocaleTimeString();

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        activeTab={activeTab}
        lastUpdated={lastUpdated}
        nextPollSeconds={nextPollSeconds}
        isSyncing={isSyncing}
        clockTime={clockTime}
      />

      {activeTab === 0 && <OverviewTab data={data} nowMs={nowMs} />}
      {activeTab === 1 && <AntigravityTab data={data} nowMs={nowMs} />}
      {activeTab === 2 && <CodexTab data={data} nowMs={nowMs} />}

      <Footer errorMsg={errorMsg} />
    </Box>
  );
};
```

- [ ] **Step 4: Verify typecheck passes on all components**

Run: `/home/anno/.bun/bin/bun test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/* src/App.tsx
git commit -m "feat: implement full-screen React/Ink interactive TUI components"
```

---

### Task 6: CLI Runner, Compilation & Global Installation

**Files:**
- Create: `src/cli.tsx`
- Build: `dist/quotawatch`
- Symlink: `~/.local/bin/quotawatch`

**Interfaces:**
- Consumes: CLI process arguments (`process.argv`).
- Produces: Executable CLI tool supporting `--watch`, `--interval`, `--json`, `--help`.

- [ ] **Step 1: Implement src/cli.tsx with argument parsing and execution modes**

`src/cli.tsx`:
```tsx
#!/usr/bin/env bun
import React from "react";
import { render } from "ink";
import { fetchDashboardData, fetchUsageRaw } from "./fetcher.ts";
import { printOneShot } from "./views/OneShotView.ts";
import { App } from "./App.tsx";

function parseInterval(arg?: string): number {
  if (!arg) return 90;
  if (arg.endsWith("m")) {
    const mins = parseFloat(arg.slice(0, -1));
    return Math.max(10, Math.round(mins * 60));
  }
  if (arg.endsWith("s")) {
    const secs = parseFloat(arg.slice(0, -1));
    return Math.max(10, Math.round(secs));
  }
  const parsed = parseInt(arg, 10);
  return isNaN(parsed) ? 90 : Math.max(10, parsed);
}

function printHelp(): void {
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

async function main(): Promise<void> {
  const args = process.argv.slice(2);

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

main();
```

- [ ] **Step 2: Build self-contained executable bundle using Bun**

Run: `/home/anno/.bun/bin/bun build src/cli.tsx --target=bun --outfile=dist/quotawatch`  
Make executable: `chmod +x dist/quotawatch`

- [ ] **Step 3: Symlink to ~/.local/bin/quotawatch**

Run: `mkdir -p ~/.local/bin && ln -sf /home/anno/Code/agents/quotawatch/dist/quotawatch /home/anno/.local/bin/quotawatch`

- [ ] **Step 4: Verify one-shot execution globally**

Run: `~/.local/bin/quotawatch`  
Expected: Formatted color-coded output with Google Antigravity & OpenAI Codex tables, exits with code 0.

- [ ] **Step 5: Verify JSON output**

Run: `~/.local/bin/quotawatch --json`  
Expected: Valid JSON output containing `providers` array.

- [ ] **Step 6: Commit and tag initial release**

```bash
git add src/cli.tsx dist/quotawatch
git commit -m "feat: complete CLI entry point, bundle executable and add symlink"
git tag v1.0.0
```
