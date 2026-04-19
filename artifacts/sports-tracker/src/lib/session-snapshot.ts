const SNAPSHOT_KEY = "betpulse_session_snapshot";

export interface SessionSnapshot {
  timestamp: number;
  totalProfitLoss: number;
  currentBankroll: number;
  winRate: number;
  roi: number;
  recentStreak: number;
  totalBets: number;
}

export function loadPreviousSnapshot(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionSnapshot;
  } catch {
    return null;
  }
}

export function saveSnapshot(data: SessionSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export interface SnapshotDelta {
  plChange: number;
  bankrollChange: number;
  winRateChange: number;
  roiChange: number;
  streakChange: number;
  betsSinceLast: number;
  hoursSinceVisit: number;
}

export function computeDelta(
  prev: SessionSnapshot,
  current: Omit<SessionSnapshot, "timestamp">,
): SnapshotDelta {
  const hoursSinceVisit = Math.round(
    (Date.now() - prev.timestamp) / (1000 * 60 * 60),
  );
  return {
    plChange: current.totalProfitLoss - prev.totalProfitLoss,
    bankrollChange: current.currentBankroll - prev.currentBankroll,
    winRateChange: current.winRate - prev.winRate,
    roiChange: current.roi - prev.roi,
    streakChange: current.recentStreak - prev.recentStreak,
    betsSinceLast: Math.max(0, current.totalBets - prev.totalBets),
    hoursSinceVisit,
  };
}
