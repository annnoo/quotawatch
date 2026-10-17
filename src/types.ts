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
