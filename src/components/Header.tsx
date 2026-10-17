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
