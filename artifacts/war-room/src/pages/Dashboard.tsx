import { useEffect, useState, useMemo } from "react";
import { useListSignals } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, Target, AlertCircle,
  BarChart2, Award, Zap, RefreshCw, Filter, ArrowUpRight,
  ArrowDownRight, Minus, Clock, Shield, Flame,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SignalStats {
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
  pending: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
  profitFactor: number | null;
  maxDrawdown: number;
  avgConfidence: number;
  avgRR: number | null;
  bestPnl: number;
  worstPnl: number;
}

// ─── Color Palette ────────────────────────────────────────────────────────────
const CHART_COLORS = {
  bull: "#00c87a",
  bear: "#ef4444",
  neutral: "#f59e0b",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
};

const OUTCOME_COLORS = [CHART_COLORS.bull, CHART_COLORS.bear, CHART_COLORS.neutral, "#94a3b8"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
            {p.name?.includes("PnL") || p.name?.includes("%") ? "%" : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "bull" | "bear" | "blue" | "amber" | "purple" | "default";
  trend?: number;
  loading?: boolean;
}

const StatCard = ({ title, value, subtitle, icon, color = "default", trend, loading }: StatCardProps) => {
  const colorMap = {
    bull: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    bear: "text-red-500 bg-red-500/10 border-red-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    default: "text-foreground bg-muted border-border",
  };

  if (loading) {
    return (
      <Card className="bg-card border">
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border hover:border-primary/30 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className={`p-1.5 rounded-lg border ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight tabular-nums text-foreground mb-1">
          {value}
        </div>
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Signal Row ───────────────────────────────────────────────────────────────
const SignalRow = ({ signal }: { signal: any }) => {
  const isLong = signal.side === "LONG";
  const isWin = signal.outcome === "WIN";
  const isLoss = signal.outcome === "LOSS";
  const isPending = !signal.outcome;

  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        {/* Side Indicator */}
        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${isLong ? "bg-emerald-500" : "bg-red-500"}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-foreground text-sm">{signal.symbol}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              isLong ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                     : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}>
              {signal.side}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {(Number(signal.confidence) * 100).toFixed(0)}% conf
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-mono">
            Entry: <span className="text-foreground">{Number(signal.entry).toFixed(4)}</span>
            {signal.stop && <> · SL: <span className="text-red-400">{Number(signal.stop).toFixed(4)}</span></>}
            {signal.target && <> · TP: <span className="text-emerald-400">{Number(signal.target).toFixed(4)}</span></>}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        {isPending ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
            Pending
          </span>
        ) : (
          <div className="space-y-1">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
              isWin ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : isLoss ? "bg-red-500/10 text-red-500 border border-red-500/20"
                    : "bg-muted text-muted-foreground border border-border"
            }`}>
              {signal.outcome}
            </span>
            {signal.pnlPct !== null && signal.pnlPct !== undefined && (
              <div className={`text-sm font-bold tabular-nums ${signal.pnlPct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {signal.pnlPct >= 0 ? "+" : ""}{Number(signal.pnlPct).toFixed(2)}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard Component ─────────────────────────────────────────────────
const Dashboard = () => {
  useDocumentMeta({
    title: "Dashboard — TradeXRay AI",
    description: "Live crypto trading signals, performance metrics, and portfolio analytics in your TradeXRay AI dashboard.",
    canonicalPath: "/dashboard",
  });
  const { data: rawData, isLoading, refetch } = useListSignals();
  const signals = useMemo(() => {
    if (!rawData) return [];
    // Support both array and paginated response
    return Array.isArray(rawData) ? rawData : (rawData as any).data || [];
  }, [rawData]);

  const [timeFilter, setTimeFilter] = useState<"7" | "30" | "90" | "all">("30");
  const [symbolFilter, setSymbolFilter] = useState<string>("all");

  // ── Compute Stats ────────────────────────────────────────────────────────────
  const stats = useMemo<SignalStats>(() => {
    if (!signals.length) return {
      total: 0, wins: 0, losses: 0, breakeven: 0, pending: 0,
      winRate: 0, avgPnl: 0, totalPnl: 0, profitFactor: null,
      maxDrawdown: 0, avgConfidence: 0, avgRR: null, bestPnl: 0, worstPnl: 0,
    };

    const now = Date.now();
    const filtered = timeFilter === "all" ? signals : signals.filter((s: any) => {
      const age = (now - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return age <= parseInt(timeFilter);
    });

    const resolved = filtered.filter((s: any) => s.outcome);
    const wins = resolved.filter((s: any) => s.outcome === "WIN");
    const losses = resolved.filter((s: any) => s.outcome === "LOSS");
    const breakeven = resolved.filter((s: any) => s.outcome === "BREAKEVEN");
    const pending = filtered.filter((s: any) => !s.outcome);

    const pnls = resolved.map((s: any) => Number(s.pnlPct) || 0);
    const totalPnl = pnls.reduce((a, b) => a + b, 0);
    const avgPnl = pnls.length > 0 ? totalPnl / pnls.length : 0;

    const grossProfit = wins.reduce((s: number, x: any) => s + (Number(x.pnlPct) || 0), 0);
    const grossLoss = Math.abs(losses.reduce((s: number, x: any) => s + (Number(x.pnlPct) || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;

    let maxDrawdown = 0, currentDD = 0;
    for (const p of pnls) {
      if (p < 0) { currentDD += Math.abs(p); maxDrawdown = Math.max(maxDrawdown, currentDD); }
      else currentDD = 0;
    }

    const avgConfidence = filtered.length > 0
      ? filtered.reduce((s: number, x: any) => s + Number(x.confidence), 0) / filtered.length
      : 0;

    const rrSignals = filtered.filter((s: any) => s.riskReward !== null && s.riskReward !== undefined);
    const avgRR = rrSignals.length > 0
      ? rrSignals.reduce((s: number, x: any) => s + (x.riskReward || 0), 0) / rrSignals.length
      : null;

    return {
      total: filtered.length,
      wins: wins.length,
      losses: losses.length,
      breakeven: breakeven.length,
      pending: pending.length,
      winRate: resolved.length > 0 ? (wins.length / resolved.length) * 100 : 0,
      avgPnl,
      totalPnl,
      profitFactor,
      maxDrawdown,
      avgConfidence,
      avgRR,
      bestPnl: pnls.length > 0 ? Math.max(...pnls) : 0,
      worstPnl: pnls.length > 0 ? Math.min(...pnls) : 0,
    };
  }, [signals, timeFilter]);

  // ── Chart Data ────────────────────────────────────────────────────────────────
  const { chartData, cumulativePnlData, symbolData, outcomeData } = useMemo(() => {
    const now = Date.now();
    const filtered = timeFilter === "all" ? signals : signals.filter((s: any) => {
      const age = (now - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return age <= parseInt(timeFilter);
    });

    const sorted = [...filtered].sort((a: any, b: any) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // PnL per signal
    const chartData = sorted
      .filter((s: any) => s.outcome)
      .map((s: any, i: number) => ({
        name: `#${i + 1}`,
        symbol: s.symbol,
        pnl: Number(s.pnlPct) || 0,
        confidence: Number(s.confidence) * 100,
      }));

    // Cumulative PnL
    let cumulative = 0;
    const cumulativePnlData = chartData.map((d) => {
      cumulative += d.pnl;
      return { ...d, cumPnl: parseFloat(cumulative.toFixed(4)) };
    });

    // By Symbol
    const symMap: Record<string, { name: string; count: number; wins: number; pnl: number }> = {};
    for (const s of filtered) {
      const sym = (s as any).symbol;
      if (!symMap[sym]) symMap[sym] = { name: sym, count: 0, wins: 0, pnl: 0 };
      symMap[sym].count++;
      if ((s as any).outcome === "WIN") symMap[sym].wins++;
      symMap[sym].pnl += Number((s as any).pnlPct) || 0;
    }
    const symbolData = Object.values(symMap).sort((a, b) => b.count - a.count).slice(0, 8);

    // Outcome Distribution
    const outcomeData = [
      { name: "WIN", value: stats.wins, color: CHART_COLORS.bull },
      { name: "LOSS", value: stats.losses, color: CHART_COLORS.bear },
      { name: "BREAKEVEN", value: stats.breakeven, color: CHART_COLORS.neutral },
      { name: "PENDING", value: stats.pending, color: "#94a3b8" },
    ].filter((d) => d.value > 0);

    return { chartData, cumulativePnlData, symbolData, outcomeData };
  }, [signals, timeFilter, stats]);

  // ── Unique Symbols ────────────────────────────────────────────────────────────
  const uniqueSymbols = useMemo(() => {
    const syms = [...new Set(signals.map((s: any) => s.symbol))].sort();
    return syms;
  }, [signals]);

  const recentSignals = useMemo(() => {
    return signals.slice(0, 15);
  }, [signals]);

  return (
    <div className="w-full min-h-full bg-background p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Trading Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time signal analytics and performance tracking
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as any)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Primary Stats Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Total Signals"
            value={stats.total}
            subtitle="All signals"
            icon={<Activity className="w-3.5 h-3.5" />}
            color="default"
            loading={isLoading}
          />
          <StatCard
            title="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            subtitle={`${stats.wins}W / ${stats.losses}L`}
            icon={<Target className="w-3.5 h-3.5" />}
            color={stats.winRate >= 50 ? "bull" : "bear"}
            loading={isLoading}
          />
          <StatCard
            title="Total PnL"
            value={`${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}%`}
            subtitle="Cumulative return"
            icon={stats.totalPnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            color={stats.totalPnl >= 0 ? "bull" : "bear"}
            loading={isLoading}
          />
          <StatCard
            title="Avg PnL"
            value={`${stats.avgPnl >= 0 ? "+" : ""}${stats.avgPnl.toFixed(2)}%`}
            subtitle="Per resolved signal"
            icon={<BarChart2 className="w-3.5 h-3.5" />}
            color={stats.avgPnl >= 0 ? "bull" : "bear"}
            loading={isLoading}
          />
          <StatCard
            title="Profit Factor"
            value={stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : "—"}
            subtitle="Gross profit / loss"
            icon={<Award className="w-3.5 h-3.5" />}
            color={stats.profitFactor !== null && stats.profitFactor >= 1.5 ? "bull" : stats.profitFactor !== null && stats.profitFactor < 1 ? "bear" : "amber"}
            loading={isLoading}
          />
          <StatCard
            title="Avg Confidence"
            value={`${(stats.avgConfidence * 100).toFixed(0)}%`}
            subtitle="Signal quality"
            icon={<Zap className="w-3.5 h-3.5" />}
            color="purple"
            loading={isLoading}
          />
        </div>

        {/* ── Secondary Stats Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-card border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Trade</span>
            </div>
            <div className="text-xl font-bold text-emerald-500 tabular-nums">
              {stats.bestPnl > 0 ? `+${stats.bestPnl.toFixed(2)}%` : "—"}
            </div>
          </Card>
          <Card className="bg-card border p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Worst Trade</span>
            </div>
            <div className="text-xl font-bold text-red-500 tabular-nums">
              {stats.worstPnl < 0 ? `${stats.worstPnl.toFixed(2)}%` : "—"}
            </div>
          </Card>
          <Card className="bg-card border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max Drawdown</span>
            </div>
            <div className="text-xl font-bold text-amber-500 tabular-nums">
              {stats.maxDrawdown > 0 ? `-${stats.maxDrawdown.toFixed(2)}%` : "—"}
            </div>
          </Card>
          <Card className="bg-card border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</span>
            </div>
            <div className="text-xl font-bold text-blue-500 tabular-nums">{stats.pending}</div>
          </Card>
        </div>

        {/* ── Charts & Tables ─────────────────────────────────────────────────── */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="bg-muted/50 border border-border h-auto p-1 flex-wrap gap-1">
            <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
            <TabsTrigger value="cumulative" className="text-xs">Cumulative PnL</TabsTrigger>
            <TabsTrigger value="signals" className="text-xs">Recent Signals</TabsTrigger>
            <TabsTrigger value="symbols" className="text-xs">By Symbol</TabsTrigger>
            <TabsTrigger value="distribution" className="text-xs">Distribution</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="mt-4 space-y-4">
            <Card className="bg-card border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">PnL Per Signal</CardTitle>
                <CardDescription>Individual signal performance (resolved signals)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : chartData.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                    No resolved signals available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                      <Bar
                        dataKey="pnl"
                        name="PnL %"
                        radius={[3, 3, 0, 0]}
                        fill={CHART_COLORS.bull}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.pnl >= 0 ? CHART_COLORS.bull : CHART_COLORS.bear}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cumulative PnL Tab */}
          <TabsContent value="cumulative" className="mt-4 space-y-4">
            <Card className="bg-card border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cumulative PnL Curve</CardTitle>
                <CardDescription>Running total return over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : cumulativePnlData.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={cumulativePnlData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <defs>
                        <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.bull} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.bull} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                      <Area
                        type="monotone"
                        dataKey="cumPnl"
                        name="Cumulative PnL %"
                        stroke={CHART_COLORS.bull}
                        strokeWidth={2}
                        fill="url(#pnlGradient)"
                        dot={false}
                        activeDot={{ r: 4, fill: CHART_COLORS.bull }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Signals Tab */}
          <TabsContent value="signals" className="mt-4 space-y-4">
            <Card className="bg-card border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Recent Signals</CardTitle>
                    <CardDescription>Latest trading signals</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">{signals.length} total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))
                  ) : recentSignals.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12 text-sm">
                      No signals available
                    </div>
                  ) : (
                    recentSignals.map((signal: any) => (
                      <SignalRow key={signal.id} signal={signal} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Symbol Tab */}
          <TabsContent value="symbols" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Signal Count by Symbol</CardTitle>
                  <CardDescription>Distribution of signals across trading pairs</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={symbolData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} width={60} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Signals" fill={CHART_COLORS.blue} radius={[0, 3, 3, 0]} />
                        <Bar dataKey="wins" name="Wins" fill={CHART_COLORS.bull} radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Symbol Performance Table</CardTitle>
                  <CardDescription>Win rate and PnL by symbol</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Symbol</th>
                          <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Signals</th>
                          <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Wins</th>
                          <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Total PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {symbolData.map((s, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-2 font-mono font-bold text-foreground">{s.name}</td>
                            <td className="py-2.5 px-2 text-right text-muted-foreground">{s.count}</td>
                            <td className="py-2.5 px-2 text-right text-emerald-500 font-semibold">{s.wins}</td>
                            <td className={`py-2.5 px-2 text-right font-bold tabular-nums ${s.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {s.pnl >= 0 ? "+" : ""}{s.pnl.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Outcome Distribution</CardTitle>
                  <CardDescription>Win / Loss / Breakeven breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : outcomeData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={outcomeData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={45}
                          paddingAngle={3}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {outcomeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance Summary</CardTitle>
                  <CardDescription>Key metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, pct: stats.winRate, color: "bg-emerald-500" },
                      { label: "Avg Confidence", value: `${(stats.avgConfidence * 100).toFixed(0)}%`, pct: stats.avgConfidence * 100, color: "bg-purple-500" },
                      { label: "Resolution Rate", value: `${stats.total > 0 ? (((stats.wins + stats.losses + stats.breakeven) / stats.total) * 100).toFixed(0) : 0}%`, pct: stats.total > 0 ? ((stats.wins + stats.losses + stats.breakeven) / stats.total) * 100 : 0, color: "bg-blue-500" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground font-medium">{item.label}</span>
                          <span className="font-bold text-foreground">{item.value}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                            style={{ width: `${Math.min(item.pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-border space-y-2">
                      {[
                        { label: "Profit Factor", value: stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : "—", color: stats.profitFactor !== null && stats.profitFactor >= 1.5 ? "text-emerald-500" : "text-amber-500" },
                        { label: "Max Drawdown", value: stats.maxDrawdown > 0 ? `-${stats.maxDrawdown.toFixed(2)}%` : "—", color: "text-red-500" },
                        { label: "Avg Risk/Reward", value: stats.avgRR !== null ? `1:${stats.avgRR.toFixed(2)}` : "—", color: "text-blue-500" },
                        { label: "Best Trade", value: stats.bestPnl > 0 ? `+${stats.bestPnl.toFixed(2)}%` : "—", color: "text-emerald-500" },
                        { label: "Worst Trade", value: stats.worstPnl < 0 ? `${stats.worstPnl.toFixed(2)}%` : "—", color: "text-red-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className={`font-bold tabular-nums ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
