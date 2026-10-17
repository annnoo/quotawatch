# QuotaWatch Design Specification

**Date:** 2026-10-17  
**Location:** `/home/anno/Code/agents/quotawatch`  
**Binary Target:** `~/.local/bin/quotawatch`  
**Status:** Approved  

---

## 1. Overview & Purpose

QuotaWatch is a terminal utility and interactive TUI monitor for AI subscription usage. It tracks quotas, usage limits, and reset countdowns across:
- **Google Antigravity** (Gemini 5-hour and Weekly, Claude & GPT 3p 5-hour and Weekly, Argon-WTU)
- **OpenAI Codex** (5-hour and 7-day rolling windows, saved reset credits)
- Ready for future providers (e.g., GitHub Copilot)

It supports two primary operational modes:
1. **One-shot rundown (`quotawatch`):** Instant formatted, color-coded summary printed directly to standard output.
2. **Interactive Watch Mode (`quotawatch -w`):** Full-screen React/Ink terminal dashboard that refreshes every 1–2 minutes (configurable) while updating reset countdowns in real-time every second.

---

## 2. Architecture & Technology Stack

- **Runtime & Package Manager:** [Bun](https://bun.sh) (`~/.bun/bin/bun`).
- **Language:** TypeScript.
- **TUI Framework:** React with [Ink](https://github.com/vadimdemedes/ink) (`ink`, `ink-text-input`, `chalk` / ANSI styling).
- **Packaging & Distribution:** 
  - Source directory: `/home/anno/Code/agents/quotawatch`.
  - Compiled / bundled self-contained executable placed at `~/.local/bin/quotawatch` with executable permissions (`chmod +x`).
- **Data Source Engine:** Calls `omp usage --json` via Bun's child process API, utilizing stored authenticated sessions for Google Antigravity and OpenAI Codex without requiring raw API keys.

---

## 3. Data Ingestion & Model

### 3.1 Raw Data Ingestion
Calls `omp usage --json --no-extensions`.

The parsed payload includes:
- `providers[]`:
  - `provider`: `"google-antigravity"` | `"openai-codex"`.
  - `fetchedAt`: Epoch timestamp in ms.
  - `limits[]`:
    - `id`: Unique limit identifier string.
    - `label`: Human-readable name (e.g. `"Gemini"`, `"Claude & GPT (shared)"`).
    - `window`:
      - `id`: `"5h"`, `"7d"`, `"weekly"`.
      - `label`: `"5 Hour"`, `"Weekly"`, `"7 days"`.
      - `durationMs`: Total duration in milliseconds.
      - `resetsAt`: Epoch timestamp in milliseconds when quota resets.
    - `amount`:
      - `used`: Used amount (number).
      - `limit`: Limit ceiling (usually 100).
      - `remaining`: Remaining amount.
      - `usedFraction`: Ratio (0.0 to 1.0).
      - `remainingFraction`: Ratio (0.0 to 1.0).
      - `unit`: `"percent"` or units.
    - `status`: `"ok"` | `"exhausted"`.
  - `resetCredits`: Optional list of available credits with expiration timestamps (`credits[].expiresAt`).
  - `metadata`: Account email, plan type (`"plus"`), project ID (`"aicode-consumers"`).

### 3.2 Normalized In-Memory State
```typescript
interface NormalizedQuota {
  provider: 'google-antigravity' | 'openai-codex' | string;
  name: string;
  windowLabel: string;
  windowDurationMs: number;
  usedPercent: number;
  remainingPercent: number;
  resetsAtMs: number;
  status: 'ok' | 'exhausted' | 'warning';
}

interface ProviderSummary {
  id: string;
  displayName: string;
  accountEmail?: string;
  plan?: string;
  quotas: NormalizedQuota[];
  resetCredits?: { count: number; soonestExpiryMs?: number };
}
```

---

## 4. Visual Design & Behavior

### 4.1 Color Coding Thresholds
Progress bars and percentage numbers are colored based on `usedPercent`:
- 🟩 **Green (Healthy):** `< 50%` used.
- 🟨 **Yellow (Moderate):** `50% – 79.9%` used.
- 🟥 **Red (Critical / Exhausted):** `≥ 80%` used, or `status === "exhausted"`.

### 4.2 Reset Countdown Calculation
- `timeUntilReset = Math.max(0, quota.resetsAtMs - Date.now())`
- Formatted dynamically:
  - If `> 24 hours`: `Xd Yh` (e.g. `6d 11h`)
  - If `1 to 24 hours`: `Xh Ym` (e.g. `4h 52m`)
  - If `< 1 hour`: `Xm Ys` (e.g. `12m 45s`)
  - If `0`: `Reset imminent`

---

## 5. User Interface (React / Ink)

### 5.1 One-Shot Mode (`quotawatch`)
- Executes once, outputs formatted text/table with ANSI color bars, and exits (code 0).
- Example output:
  ```text
  QuotaWatch — AI Subscription Usage
  Fetched: 2026-10-17 23:30:00

  Google Antigravity (annokerp96@googlemail.com)
    ● Gemini (5 Hour)                 [░░░░░░░░░░░░░░░░░░░░]   0.6% used · resets in 4h 52m
    ● Gemini (Weekly)                 [████████████████████] 100.0% used · resets in 6d 11h (EXHAUSTED)
    ● Gemini (Weekly)                 [██████░░░░░░░░░░░░░░]  30.5% used · resets in 6d 2h
    ● Claude & GPT Shared (5 Hour)    [░░░░░░░░░░░░░░░░░░░░]   0.0% used · resets in 4h 59m
    ● Claude & GPT Shared (Weekly)    [██████████░░░░░░░░░░]  50.3% used · resets in 6d 14h

  OpenAI Codex (Plus · annokerp96@googlemail.com · 2 saved resets)
    ● Codex (5 Hour)                  [█░░░░░░░░░░░░░░░░░░░]   3.0% used · resets in 4h 52m
    ● Codex (7 Days)                  [██████░░░░░░░░░░░░░░]  32.0% used · resets in 6d 13h
  ```

### 5.2 Watch / Interactive Mode (`quotawatch -w`)
Uses Ink full-screen alternate terminal buffer:
- **Header:**
  - App title + live local clock.
  - Sync indicator: `Last updated: 14s ago · Next poll in 76s` (shows spinner during active fetch).
  - Navigation tab bar: `[1: Overview]  [2: Antigravity]  [3: Codex]`
- **Tab 1: Overview:**
  - Side-by-side or stacked summary cards for Antigravity & Codex with high-level health status and primary quotas.
- **Tab 2: Antigravity Detail:**
  - Detailed list of all 5 rolling windows, capacities, project details, and reset countdowns.
- **Tab 3: Codex Detail:**
  - Detailed breakdown of 5-hour and 7-day limits, meter status, and saved reset credit expiration schedules.
- **Footer:**
  - Keyboard navigation help: `[Tab/1-3] Switch View  [r] Refresh Now  [q/Esc] Quit`

---

## 6. CLI Arguments & Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--watch` | `-w` | Launch interactive full-screen watch mode | `false` (one-shot) |
| `--interval <dur>` | `-i` | Polling interval in seconds or human format (e.g. `90`, `90s`, `2m`) | `90s` |
| `--json` | `-j` | Print normalized JSON to stdout and exit | `false` |
| `--help` | `-h` | Display usage instructions and exit | - |
| `--version` | `-v` | Display version number and exit | - |

---

## 7. Error Handling & Resilience

1. **Child Process Timeout:** If `omp usage --json` takes > 15s, cancel and retain last known snapshot.
2. **Missing Provider / Partial Offline:** If one provider fails or is unauthenticated, render a grey/muted warning card while keeping remaining providers functional.
3. **Graceful Teardown:** Catch `SIGINT`, `SIGTERM`, `q`, and `Esc` to cleanly restore terminal cursor, disable raw mode, and exit without leaving residual terminal artifacts.

---

## 8. Verification Plan

1. **Unit / Parsing Test:** Validate parser logic against real `omp usage --json` payloads.
2. **CLI Flag Testing:**
   - Verify `quotawatch` prints one-shot table and exits with code 0.
   - Verify `quotawatch --json` outputs valid JSON.
   - Verify `quotawatch --help` prints flag documentation.
3. **Interactive Watch Mode Testing:**
   - Verify tabs switch on `1`, `2`, `3`, and `Tab`.
   - Verify manual refresh trigger on `r`.
   - Verify clean exit on `q` and `Ctrl+C`.
4. **Global Symlink Verification:**
   - Test execution from different directories via `~/.local/bin/quotawatch`.
