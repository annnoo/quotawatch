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
