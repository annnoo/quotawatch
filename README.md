# ◈ QuotaWatch

A sleek, fast terminal utility and interactive TUI monitor for tracking AI subscription quotas, remaining capacities, and reset countdowns across your AI developer tooling.

Currently tracks:
- **Google Antigravity** (Gemini 5h & Weekly rolling limits, Claude & GPT shared 3p limits, Argon-WTU)
- **OpenAI Codex** (5-hour and 7-day rolling windows, saved reset credit counters and expiry dates)

---

## ⚡ Quick Look

### 1. One-Shot Rundown (`quotawatch`)
Run `quotawatch` anytime to print a color-coded summary directly into your terminal:

```text
◈ QuotaWatch — AI Subscription Quotas (12:12:56 AM)
──────────────────────────────────────────────────────────────────────

  OpenAI Codex [PLUS] (user@googlemail.com) · ✦ 2 saved resets
    ● Codex (5 hours)                  [████████████████░░░░]  82.0% used · resets in 4h 3m
    ● Codex (7 days)                   [███░░░░░░░░░░░░░░░░░]  13.0% used · resets in 6d 23h

  Google Antigravity (user@googlemail.com)
    ● Gemini (Weekly)                  [████████████████████] 100.0% used · resets in 6d 9h  EXHAUSTED 
    ● Claude & GPT (shared) (Weekly)   [██████████░░░░░░░░░░]  50.3% used · resets in 6d 12h
    ● Gemini (Weekly)                  [███████░░░░░░░░░░░░░]  35.4% used · resets in 6d 0h
    ● Gemini (5 Hour)                  [███░░░░░░░░░░░░░░░░░]  15.1% used · resets in 2h 52m
    ● Claude & GPT (shared) (5 Hour)   [░░░░░░░░░░░░░░░░░░░░]   0.0% used · resets in 4h 54m

──────────────────────────────────────────────────────────────────────
```

### 2. Live Interactive Dashboard (`quotawatch -w`)
Run in auto-updating watch mode to keep an eye on quotas while coding:
```bash
quotawatch -w
```
* **Real-time client countdowns:** Ticks every second locally (`4h 2m 58s`, `4h 2m 57s`...) so countdowns stay smooth without spamming API requests.
* **Auto-refresh:** Re-polls provider metrics every 1–2 minutes (configurable).
* **Interactive Views:** Switch tabs between Overview, Google Antigravity, and OpenAI Codex.

---

## 🚀 Installation

QuotaWatch is bundled as a self-contained executable powered by [Bun](https://bun.sh).

### Global Binary Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/your-username/quotawatch.git /home/anno/Code/agents/quotawatch
   cd /home/anno/Code/agents/quotawatch
   bun install
   ```

2. **Build the standalone executable:**
   ```bash
   bun run build
   chmod +x dist/quotawatch
   ```

3. **Symlink to your local PATH:**
   ```bash
   mkdir -p ~/.local/bin
   ln -sf /home/anno/Code/agents/quotawatch/dist/quotawatch ~/.local/bin/quotawatch
   ```

Ensure `~/.local/bin` is in your shell's `PATH`.

---

## 📖 Usage & Options

```text
◈ QuotaWatch — AI Subscription Quota & Usage Monitor

USAGE:
  quotawatch [OPTIONS]

OPTIONS:
  -w, --watch            Launch interactive auto-refreshing React/Ink TUI
  -i, --interval <dur>   Polling interval in seconds or minutes (e.g. 90s, 2m) [default: 90s]
  -j, --json             Print normalized JSON snapshot to stdout and exit
  -h, --help             Show this help screen
  -v, --version          Show version
```

### Examples

```bash
# Print instant color-coded rundown
quotawatch

# Launch live dashboard with default 90-second refresh
quotawatch -w

# Launch live dashboard refreshing every 2 minutes
quotawatch -w -i 2m

# Launch live dashboard refreshing every 60 seconds
quotawatch -w --interval 60s

# Output raw normalized JSON (useful for piping into tmux status lines or polybar)
quotawatch --json
```

---

## ⌨️ Keybindings in Watch Mode

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Cycle forward/backward through tabs |
| `1` | Switch to **[1: Overview]** tab |
| `2` | Switch to **[2: Antigravity]** detail tab |
| `3` | Switch to **[3: Codex]** detail tab |
| `r` | Force an immediate background refresh |
| `q` / `Esc` / `Ctrl+C` | Quit and cleanly restore terminal |

---

## 🎨 Color Coding

Progress bars and percentages are color-coded to give you an immediate visual cue:

| Level | Range / State | Indicator |
|---|---|---|
| 🟩 **Green** | `< 50%` used | Healthy quota remaining |
| 🟨 **Yellow** | `50% – 79.9%` used | Moderate quota burn |
| 🟥 **Red** | `≥ 80%` used or status `EXHAUSTED` | Approaching limit or exhausted |

---

## 🛠️ Development & Testing

```bash
# Run unit tests
bun test

# Run in development mode without compiling
bun run src/cli.tsx

# Run watch mode in development
bun run src/cli.tsx -w
```

All 22 unit tests run in < 60ms covering formatting, countdown mathematics, interval parsing, JSON normalization, and ANSI rendering.

---

## 📄 License

MIT
