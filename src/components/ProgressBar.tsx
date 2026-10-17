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
