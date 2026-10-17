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
