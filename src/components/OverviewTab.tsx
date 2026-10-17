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
                    <Text color="gray">
                      {countdown === "Reset imminent"
                        ? countdown
                        : `resets in ${countdown}`}
                    </Text>
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
