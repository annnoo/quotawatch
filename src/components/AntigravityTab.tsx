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
