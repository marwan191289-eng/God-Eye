import { SignalLog } from "@workspace/db";

export interface SignalMetrics {
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  riskRewardRatio: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalReturn: number;
}

export interface SignalStats {
  total: number;
  resolved: number;
  unresolved: number;
  wins: number;
  losses: number;
  breakeven: number;
  cancelled: number;
}

export interface SymbolAnalysis {
  symbol: string;
  stats: SignalStats;
  metrics: SignalMetrics;
  recentSignals: SignalLog[];
  trend: "bullish" | "bearish" | "neutral";
  confidence: number;
}

/**
 * Calculate comprehensive signal metrics
 */
export function calculateMetrics(signals: SignalLog[]): SignalMetrics {
  const resolved = signals.filter((s) => s.resolvedAt);
  const wins = resolved.filter((s) => s.pnlPct && Number(s.pnlPct) > 0);
  const losses = resolved.filter((s) => s.pnlPct && Number(s.pnlPct) < 0);

  const winPnls = wins.map((s) => Number(s.pnlPct || 0));
  const lossPnls = losses.map((s) => Math.abs(Number(s.pnlPct || 0)));

  const avgWin = winPnls.length > 0 ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0;
  const avgLoss = lossPnls.length > 0 ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0;

  const totalWinPnl = winPnls.reduce((a, b) => a + b, 0);
  const totalLossPnl = lossPnls.reduce((a, b) => a + b, 0);

  const winRate = resolved.length > 0 ? (wins.length / resolved.length) * 100 : 0;
  const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? Infinity : 0;
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  const totalReturn = totalWinPnl - totalLossPnl;

  // Calculate Sharpe Ratio (simplified)
  const allPnls = resolved.map((s) => Number(s.pnlPct || 0));
  const mean = allPnls.length > 0 ? allPnls.reduce((a, b) => a + b, 0) / allPnls.length : 0;
  const variance =
    allPnls.length > 0 ? allPnls.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / allPnls.length : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? mean / stdDev : 0;

  // Calculate Max Drawdown
  let maxDrawdown = 0;
  let runningMax = 0;
  let cumPnl = 0;
  for (const pnl of allPnls) {
    cumPnl += pnl;
    if (cumPnl > runningMax) {
      runningMax = cumPnl;
    } else {
      maxDrawdown = Math.max(maxDrawdown, runningMax - cumPnl);
    }
  }

  return {
    winRate: parseFloat(winRate.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(4)),
    avgLoss: parseFloat(avgLoss.toFixed(4)),
    riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(4)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(4)),
  };
}

/**
 * Calculate signal statistics
 */
export function calculateStats(signals: SignalLog[]): SignalStats {
  return {
    total: signals.length,
    resolved: signals.filter((s) => s.resolvedAt).length,
    unresolved: signals.filter((s) => !s.resolvedAt).length,
    wins: signals.filter((s) => s.outcome === "WIN").length,
    losses: signals.filter((s) => s.outcome === "LOSS").length,
    breakeven: signals.filter((s) => s.outcome === "BREAKEVEN").length,
    cancelled: signals.filter((s) => s.outcome === "CANCELLED").length,
  };
}

/**
 * Analyze signals by symbol
 */
export function analyzeBySymbol(signals: SignalLog[]): Record<string, SymbolAnalysis> {
  const bySymbol: Record<string, SignalLog[]> = {};

  for (const signal of signals) {
    if (!bySymbol[signal.symbol]) {
      bySymbol[signal.symbol] = [];
    }
    bySymbol[signal.symbol].push(signal);
  }

  const analysis: Record<string, SymbolAnalysis> = {};

  for (const [symbol, symbolSignals] of Object.entries(bySymbol)) {
    const stats = calculateStats(symbolSignals);
    const metrics = calculateMetrics(symbolSignals);

    // Determine trend based on recent signals
    const recentSignals = symbolSignals.slice(0, 10);
    const longs = recentSignals.filter((s) => s.side === "LONG").length;
    const shorts = recentSignals.filter((s) => s.side === "SHORT").length;
    const trend = longs > shorts ? "bullish" : shorts > longs ? "bearish" : "neutral";

    // Calculate average confidence
    const confidence =
      symbolSignals.length > 0
        ? symbolSignals.reduce((sum, s) => sum + Number(s.confidence || 0), 0) / symbolSignals.length
        : 0;

    analysis[symbol] = {
      symbol,
      stats,
      metrics,
      recentSignals: symbolSignals.slice(0, 5),
      trend,
      confidence: parseFloat(confidence.toFixed(4)),
    };
  }

  return analysis;
}

/**
 * Generate signal recommendations based on analytics
 */
export function generateRecommendations(analysis: Record<string, SymbolAnalysis>): string[] {
  const recommendations: string[] = [];

  for (const [symbol, data] of Object.entries(analysis)) {
    const { metrics, stats, trend, confidence } = data;

    // High win rate
    if (metrics.winRate >= 60) {
      recommendations.push(`${symbol}: Strong performance with ${metrics.winRate}% win rate`);
    }

    // Good risk/reward
    if (metrics.riskRewardRatio >= 2) {
      recommendations.push(`${symbol}: Excellent risk/reward ratio of ${metrics.riskRewardRatio}`);
    }

    // High confidence signals
    if (confidence >= 0.75) {
      recommendations.push(`${symbol}: High confidence signals (${(confidence * 100).toFixed(0)}%)`);
    }

    // Trend alignment
    if (trend === "bullish" && stats.wins > stats.losses) {
      recommendations.push(`${symbol}: Bullish trend with positive performance`);
    }

    // Warning signs
    if (metrics.maxDrawdown > 20) {
      recommendations.push(`⚠️ ${symbol}: High drawdown (${metrics.maxDrawdown}%) - reduce exposure`);
    }

    if (metrics.winRate < 40 && stats.resolved > 10) {
      recommendations.push(`⚠️ ${symbol}: Low win rate (${metrics.winRate}%) - review strategy`);
    }
  }

  return recommendations;
}
