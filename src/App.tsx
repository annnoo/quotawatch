import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const isSyncingRef = useRef(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [nextPollSeconds, setNextPollSeconds] = useState(pollIntervalSeconds);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [nowMs, setNowMs] = useState(Date.now());

  const triggerRefresh = useCallback(async () => {
    if (isSyncingRef.current) {
      return;
    }
    isSyncingRef.current = true;
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
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [pollIntervalSeconds]);

  // 1-second ticker for countdowns and local clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
      setNextPollSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Trigger refresh when countdown reaches 0
  useEffect(() => {
    if (nextPollSeconds === 0) {
      triggerRefresh();
      setNextPollSeconds(pollIntervalSeconds);
    }
  }, [nextPollSeconds, triggerRefresh, pollIntervalSeconds]);

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
