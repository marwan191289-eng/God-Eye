import { type IRouter, type Response } from "express";
import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { signalLogTable, userRolesTable } from "@workspace/db";
import { desc, eq, and, gte, lte, sql, count, avg } from "drizzle-orm";
import { CreateSignalBody } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.userId;
  const role = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId))
    .limit(1);
  if (!role.length || role[0].role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// Enhanced signal response formatter
function formatSignal(s: any) {
  const entry = Number(s.entry);
  const stop = s.stop ? Number(s.stop) : null;
  const target = s.target ? Number(s.target) : null;

  // Calculate Risk/Reward ratio
  let riskReward: number | null = null;
  if (stop !== null && target !== null && entry > 0) {
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    riskReward = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : null;
  }

  // Calculate potential gain/loss %
  let potentialGainPct: number | null = null;
  let potentialLossPct: number | null = null;
  if (target !== null && entry > 0) {
    potentialGainPct = parseFloat((((target - entry) / entry) * 100).toFixed(2));
  }
  if (stop !== null && entry > 0) {
    potentialLossPct = parseFloat((((stop - entry) / entry) * 100).toFixed(2));
  }

  return {
    id: s.id,
    symbol: s.symbol,
    side: s.side as "LONG" | "SHORT",
    entry,
    stop,
    target,
    confidence: Number(s.confidence),
    confidencePct: parseFloat((Number(s.confidence) * 100).toFixed(1)),
    features: s.features || {},
    outcome: s.outcome ?? null,
    pnlPct: s.pnlPct ? Number(s.pnlPct) : null,
    resolvedAt: s.resolvedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    // Enhanced computed fields
    riskReward,
    potentialGainPct,
    potentialLossPct,
    isResolved: !!s.resolvedAt,
    signalAge: Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60)), // hours
  };
}

// ─── GET /api/signals ─────────────────────────────────────────────────────────
// List signals with filtering, pagination, and sorting
router.get("/", requireAuth, async (req: any, res: Response) => {
  try {
    const {
      symbol,
      side,
      outcome,
      limit = 50,
      offset = 0,
      resolved,
      minConfidence,
      maxConfidence,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query;

    const conditions: any[] = [];
    if (symbol) conditions.push(eq(signalLogTable.symbol, String(symbol).toUpperCase()));
    if (side) conditions.push(eq(signalLogTable.side, String(side).toUpperCase()));
    if (outcome) conditions.push(eq(signalLogTable.outcome, String(outcome).toUpperCase()));
    if (resolved === "true") conditions.push(sql`${signalLogTable.resolvedAt} IS NOT NULL`);
    if (resolved === "false") conditions.push(sql`${signalLogTable.resolvedAt} IS NULL`);
    if (minConfidence) conditions.push(gte(signalLogTable.confidence, String(minConfidence)));
    if (maxConfidence) conditions.push(lte(signalLogTable.confidence, String(maxConfidence)));
    if (dateFrom) conditions.push(gte(signalLogTable.createdAt, new Date(String(dateFrom))));
    if (dateTo) conditions.push(lte(signalLogTable.createdAt, new Date(String(dateTo))));

    const limitNum = Math.min(parseInt(String(limit)) || 50, 500);
    const offsetNum = parseInt(String(offset)) || 0;

    let query: any = db.select().from(signalLogTable);
    if (conditions.length > 0) query = query.where(and(...conditions));
    query = query.orderBy(desc(signalLogTable.createdAt)).limit(limitNum).offset(offsetNum);

    const signals = await query;

    // Count total for pagination
    let countQuery: any = db.select({ total: sql<number>`count(*)` }).from(signalLogTable);
    if (conditions.length > 0) countQuery = countQuery.where(and(...conditions));
    const [{ total }] = await countQuery;

    res.json({
      data: signals.map(formatSignal),
      pagination: {
        total: Number(total),
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < Number(total),
      },
    });
  } catch (err) {
    req.log.error({ err }, "listSignals error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/signals/analytics ───────────────────────────────────────────────
// Advanced analytics with multiple metrics
router.get("/analytics", requireAuth, async (req: any, res: Response) => {
  try {
    const { days = 30, symbol } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(String(days)));

    const conditions: any[] = [gte(signalLogTable.createdAt, daysAgo)];
    if (symbol) conditions.push(eq(signalLogTable.symbol, String(symbol).toUpperCase()));

    const signals = await db
      .select()
      .from(signalLogTable)
      .where(and(...conditions))
      .orderBy(desc(signalLogTable.createdAt));

    const formatted = signals.map(formatSignal);

    // ── Core Metrics ──────────────────────────────────────────────────────────
    const totalSignals = formatted.length;
    const resolvedSignals = formatted.filter((s) => s.isResolved);
    const unresolvedSignals = formatted.filter((s) => !s.isResolved);
    const winningSignals = resolvedSignals.filter((s) => s.outcome === "WIN");
    const losingSignals = resolvedSignals.filter((s) => s.outcome === "LOSS");
    const breakevenSignals = resolvedSignals.filter((s) => s.outcome === "BREAKEVEN");
    const cancelledSignals = resolvedSignals.filter((s) => s.outcome === "CANCELLED");

    const winRate = resolvedSignals.length > 0
      ? parseFloat(((winningSignals.length / resolvedSignals.length) * 100).toFixed(2))
      : 0;

    const avgPnl = resolvedSignals.length > 0
      ? parseFloat((resolvedSignals.reduce((sum, s) => sum + (s.pnlPct || 0), 0) / resolvedSignals.length).toFixed(4))
      : 0;

    const totalPnl = resolvedSignals.reduce((sum, s) => sum + (s.pnlPct || 0), 0);

    // ── Advanced Metrics ──────────────────────────────────────────────────────
    const avgConfidence = totalSignals > 0
      ? parseFloat((formatted.reduce((sum, s) => sum + s.confidence, 0) / totalSignals).toFixed(4))
      : 0;

    // Profit Factor: Gross Profit / Gross Loss
    const grossProfit = winningSignals.reduce((sum, s) => sum + (s.pnlPct || 0), 0);
    const grossLoss = Math.abs(losingSignals.reduce((sum, s) => sum + (s.pnlPct || 0), 0));
    const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : null;

    // Max Drawdown (largest consecutive loss streak)
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    for (const s of resolvedSignals) {
      if ((s.pnlPct || 0) < 0) {
        currentDrawdown += Math.abs(s.pnlPct || 0);
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      } else {
        currentDrawdown = 0;
      }
    }

    // Sharpe-like ratio (avg pnl / std dev of pnl)
    let sharpeRatio: number | null = null;
    if (resolvedSignals.length > 1) {
      const pnls = resolvedSignals.map((s) => s.pnlPct || 0);
      const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
      const variance = pnls.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pnls.length;
      const stdDev = Math.sqrt(variance);
      sharpeRatio = stdDev > 0 ? parseFloat((mean / stdDev).toFixed(3)) : null;
    }

    // Average Risk/Reward
    const signalsWithRR = formatted.filter((s) => s.riskReward !== null);
    const avgRiskReward = signalsWithRR.length > 0
      ? parseFloat((signalsWithRR.reduce((sum, s) => sum + (s.riskReward || 0), 0) / signalsWithRR.length).toFixed(2))
      : null;

    // Best and Worst signals
    const bestSignal = resolvedSignals.reduce((best, s) =>
      (s.pnlPct || 0) > (best?.pnlPct || -Infinity) ? s : best, null as any);
    const worstSignal = resolvedSignals.reduce((worst, s) =>
      (s.pnlPct || 0) < (worst?.pnlPct || Infinity) ? s : worst, null as any);

    // ── By Symbol ─────────────────────────────────────────────────────────────
    const bySymbol: Record<string, any> = {};
    for (const s of formatted) {
      if (!bySymbol[s.symbol]) {
        bySymbol[s.symbol] = {
          symbol: s.symbol,
          total: 0,
          resolved: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          avgPnl: 0,
          totalPnl: 0,
          avgConfidence: 0,
          longCount: 0,
          shortCount: 0,
        };
      }
      const sym = bySymbol[s.symbol];
      sym.total++;
      if (s.side === "LONG") sym.longCount++;
      else sym.shortCount++;
      sym.avgConfidence += s.confidence;
      if (s.isResolved) {
        sym.resolved++;
        if (s.outcome === "WIN") sym.wins++;
        if (s.outcome === "LOSS") sym.losses++;
        sym.totalPnl += s.pnlPct || 0;
      }
    }
    for (const sym of Object.values(bySymbol) as any[]) {
      sym.winRate = sym.resolved > 0 ? parseFloat(((sym.wins / sym.resolved) * 100).toFixed(2)) : 0;
      sym.avgPnl = sym.resolved > 0 ? parseFloat((sym.totalPnl / sym.resolved).toFixed(4)) : 0;
      sym.avgConfidence = sym.total > 0 ? parseFloat((sym.avgConfidence / sym.total).toFixed(4)) : 0;
      sym.totalPnl = parseFloat(sym.totalPnl.toFixed(4));
    }

    // ── By Side (LONG vs SHORT) ────────────────────────────────────────────────
    const longSignals = formatted.filter((s) => s.side === "LONG");
    const shortSignals = formatted.filter((s) => s.side === "SHORT");
    const longResolved = longSignals.filter((s) => s.isResolved);
    const shortResolved = shortSignals.filter((s) => s.isResolved);
    const longWins = longResolved.filter((s) => s.outcome === "WIN");
    const shortWins = shortResolved.filter((s) => s.outcome === "WIN");

    const bySide = {
      LONG: {
        total: longSignals.length,
        resolved: longResolved.length,
        wins: longWins.length,
        winRate: longResolved.length > 0 ? parseFloat(((longWins.length / longResolved.length) * 100).toFixed(2)) : 0,
        avgPnl: longResolved.length > 0
          ? parseFloat((longResolved.reduce((s, x) => s + (x.pnlPct || 0), 0) / longResolved.length).toFixed(4))
          : 0,
      },
      SHORT: {
        total: shortSignals.length,
        resolved: shortResolved.length,
        wins: shortWins.length,
        winRate: shortResolved.length > 0 ? parseFloat(((shortWins.length / shortResolved.length) * 100).toFixed(2)) : 0,
        avgPnl: shortResolved.length > 0
          ? parseFloat((shortResolved.reduce((s, x) => s + (x.pnlPct || 0), 0) / shortResolved.length).toFixed(4))
          : 0,
      },
    };

    // ── Daily Performance ─────────────────────────────────────────────────────
    const dailyMap: Record<string, { date: string; signals: number; wins: number; losses: number; pnl: number }> = {};
    for (const s of formatted) {
      const date = s.createdAt.split("T")[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { date, signals: 0, wins: 0, losses: 0, pnl: 0 };
      }
      dailyMap[date].signals++;
      if (s.outcome === "WIN") dailyMap[date].wins++;
      if (s.outcome === "LOSS") dailyMap[date].losses++;
      dailyMap[date].pnl += s.pnlPct || 0;
    }
    const dailyPerformance = Object.values(dailyMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, pnl: parseFloat(d.pnl.toFixed(4)) }));

    // ── Confidence Distribution ───────────────────────────────────────────────
    const confidenceBuckets = [
      { range: "0-20%", min: 0, max: 0.2, count: 0, wins: 0 },
      { range: "20-40%", min: 0.2, max: 0.4, count: 0, wins: 0 },
      { range: "40-60%", min: 0.4, max: 0.6, count: 0, wins: 0 },
      { range: "60-80%", min: 0.6, max: 0.8, count: 0, wins: 0 },
      { range: "80-100%", min: 0.8, max: 1.01, count: 0, wins: 0 },
    ];
    for (const s of formatted) {
      const bucket = confidenceBuckets.find((b) => s.confidence >= b.min && s.confidence < b.max);
      if (bucket) {
        bucket.count++;
        if (s.outcome === "WIN") bucket.wins++;
      }
    }

    res.json({
      period: {
        days: parseInt(String(days)),
        from: daysAgo.toISOString(),
        to: new Date().toISOString(),
      },
      summary: {
        totalSignals,
        resolvedSignals: resolvedSignals.length,
        unresolvedSignals: unresolvedSignals.length,
        winRate,
        avgPnl,
        totalPnl: parseFloat(totalPnl.toFixed(4)),
        totalWins: winningSignals.length,
        totalLosses: losingSignals.length,
        totalBreakeven: breakevenSignals.length,
        totalCancelled: cancelledSignals.length,
        avgConfidence,
        profitFactor,
        maxDrawdown: parseFloat(maxDrawdown.toFixed(4)),
        sharpeRatio,
        avgRiskReward,
        bestSignal: bestSignal ? { symbol: bestSignal.symbol, pnlPct: bestSignal.pnlPct, id: bestSignal.id } : null,
        worstSignal: worstSignal ? { symbol: worstSignal.symbol, pnlPct: worstSignal.pnlPct, id: worstSignal.id } : null,
      },
      bySymbol,
      bySide,
      dailyPerformance,
      confidenceDistribution: confidenceBuckets,
      signals: formatted,
    });
  } catch (err) {
    req.log.error({ err }, "analytics error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/signals/leaderboard ─────────────────────────────────────────────
// Top performing symbols
router.get("/leaderboard", requireAuth, async (req: any, res: Response) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(String(days)));

    const signals = await db
      .select()
      .from(signalLogTable)
      .where(and(
        gte(signalLogTable.createdAt, daysAgo),
        sql`${signalLogTable.resolvedAt} IS NOT NULL`,
      ));

    const symbolMap: Record<string, any> = {};
    for (const s of signals) {
      const sym = s.symbol;
      if (!symbolMap[sym]) {
        symbolMap[sym] = { symbol: sym, wins: 0, losses: 0, totalPnl: 0, count: 0 };
      }
      symbolMap[sym].count++;
      if (s.outcome === "WIN") symbolMap[sym].wins++;
      if (s.outcome === "LOSS") symbolMap[sym].losses++;
      symbolMap[sym].totalPnl += s.pnlPct ? Number(s.pnlPct) : 0;
    }

    const leaderboard = Object.values(symbolMap)
      .map((s: any) => ({
        ...s,
        winRate: s.count > 0 ? parseFloat(((s.wins / s.count) * 100).toFixed(2)) : 0,
        avgPnl: s.count > 0 ? parseFloat((s.totalPnl / s.count).toFixed(4)) : 0,
        totalPnl: parseFloat(s.totalPnl.toFixed(4)),
      }))
      .sort((a: any, b: any) => b.totalPnl - a.totalPnl)
      .slice(0, parseInt(String(limit)));

    res.json(leaderboard);
  } catch (err) {
    req.log.error({ err }, "leaderboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/signals/:id ──────────────────────────────────────────────────────
router.get("/:id", requireAuth, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const signal = await db
      .select()
      .from(signalLogTable)
      .where(eq(signalLogTable.id, id))
      .limit(1);

    if (!signal.length) {
      return res.status(404).json({ error: "Signal not found" });
    }

    res.json(formatSignal(signal[0]));
  } catch (err) {
    req.log.error({ err }, "getSignal error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/signals ────────────────────────────────────────────────────────
router.post("/", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const parsed = CreateSignalBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.errors });

    const { symbol, side, entry, stop, target, confidence, features } = parsed.data;

    // Validate stop/target logic
    if (side === "LONG" && stop && stop >= entry) {
      return res.status(400).json({ error: "Stop loss must be below entry for LONG signals" });
    }
    if (side === "SHORT" && stop && stop <= entry) {
      return res.status(400).json({ error: "Stop loss must be above entry for SHORT signals" });
    }
    if (side === "LONG" && target && target <= entry) {
      return res.status(400).json({ error: "Target must be above entry for LONG signals" });
    }
    if (side === "SHORT" && target && target >= entry) {
      return res.status(400).json({ error: "Target must be below entry for SHORT signals" });
    }

    const [inserted] = await db
      .insert(signalLogTable)
      .values({
        symbol: symbol.toUpperCase(),
        side,
        entry: String(entry),
        stop: stop ? String(stop) : null,
        target: target ? String(target) : null,
        confidence: String(confidence),
        features: features || {},
      })
      .returning();

    res.status(201).json(formatSignal(inserted));
  } catch (err) {
    req.log.error({ err }, "createSignal error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/signals/:id/outcome ───────────────────────────────────────────
router.patch("/:id/outcome", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { outcome, pnlPct } = req.body;

    const validOutcomes = ["WIN", "LOSS", "BREAKEVEN", "CANCELLED"];
    if (!validOutcomes.includes(outcome)) {
      return res.status(400).json({ error: `Invalid outcome. Must be one of: ${validOutcomes.join(", ")}` });
    }

    const [updated] = await db
      .update(signalLogTable)
      .set({
        outcome,
        pnlPct: pnlPct !== undefined && pnlPct !== null ? String(pnlPct) : null,
        resolvedAt: new Date(),
      })
      .where(eq(signalLogTable.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Signal not found" });
    }

    res.json(formatSignal(updated));
  } catch (err) {
    req.log.error({ err }, "updateSignalOutcome error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/signals/:id ───────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const [deleted] = await db
      .delete(signalLogTable)
      .where(eq(signalLogTable.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Signal not found" });
    }

    res.json({ success: true, id });
  } catch (err) {
    req.log.error({ err }, "deleteSignal error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
