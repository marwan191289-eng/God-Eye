import type { FuturesSignal } from "@/lib/futures";
import { fmtFundingRate, fmtOI } from "@/lib/futures";
import { cn } from "@/lib/utils";
import { Landmark, TrendingUp, TrendingDown, Clock, Database } from "lucide-react";

export function FundingRatePanel({ signal }: { signal: FuturesSignal | null }) {
  if (!signal) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-4 flex items-center gap-3">
        <Database className="size-5 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">جارٍ جلب بيانات المشتقات من Binance Futures...</div>
      </div>
    );
  }

  const { raw, confidence, fundingBias, fundingTrend, oiTrend, premiumPct, nextFundingMinutes } = signal;
  const currentFunding = raw.fundingRate;
  const currentOI = raw.openInterest;

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 glass space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-whale/15 border border-whale/30 flex items-center justify-center">
            <Landmark className="size-5 text-whale" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-whale">تحليل المشتقات</div>
            <div className="text-sm font-bold">Funding + Open Interest</div>
          </div>
        </div>
        <ConfidenceBadge pct={confidence} />
      </div>

      {/* Main metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Metric
          label="معدل التمويل الحالي"
          value={fmtFundingRate(currentFunding)}
          sub={currentFunding > 0.001 ? "مراكز طويلة مزدحمة" : currentFunding < -0.001 ? "مراكز قصيرة مزدحمة" : "توازن"}
          color={currentFunding > 0.001 ? "bear" : currentFunding < -0.001 ? "bull" : "muted"}
        />
        <Metric
          label="العلاوة Futures"
          value={`${premiumPct >= 0 ? "+" : ""}${premiumPct.toFixed(3)}%`}
          sub={premiumPct > 0.1 ? "اهتمام بالشراء" : premiumPct < -0.05 ? "قلق" : "طبيعي"}
          color={premiumPct > 0.1 ? "bull" : premiumPct < -0.05 ? "bear" : "muted"}
        />
        <Metric
          label="العقود المفتوحة"
          value={fmtOI(currentOI)}
          sub={oiTrend > 0.2 ? "تزايد" : oiTrend < -0.2 ? "تناقص" : "مستقر"}
          color={oiTrend > 0.2 ? "bull" : oiTrend < -0.2 ? "bear" : "muted"}
        />
        <Metric
          label="الفتورة القادمة"
          value={`${Math.floor(nextFundingMinutes / 60)}h ${nextFundingMinutes % 60}m`}
          sub="Binance Futures 8h cycle"
          color="muted"
        />
      </div>

      {/* Funding history sparkline */}
      {raw.fundingHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-card/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">تاريخ معدل التمويل (آخر 8 فترات)</div>
          <div className="flex items-end gap-1 h-12">
            {[...raw.fundingHistory].reverse().map((f, i) => {
              const max = Math.max(...raw.fundingHistory.map((x) => Math.abs(x.fundingRate)), 0.0001);
              const h = Math.max(4, Math.min(48, (Math.abs(f.fundingRate) / max) * 48));
              const isPos = f.fundingRate >= 0;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${fmtFundingRate(f.fundingRate)} @ ${new Date(f.fundingTime).toLocaleDateString()}`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-sm",
                      isPos ? "bg-bear/60" : "bg-bull/60"
                    )}
                    style={{ height: `${h}px` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] mono text-muted-foreground mt-1">
            <span>الأقدم</span>
            <span>الأحدث</span>
          </div>
        </div>
      )}

      {/* Signal interpretation */}
      <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">تفسير الإشارة</div>
        <div className="space-y-1 text-[12px] text-foreground/90">
          {signal.reasoning.map((r, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-whale mt-0.5">▸</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Combined bias indicator */}
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-muted-foreground">الانحياز المجمع:</span>
        <BiasDot bias={fundingBias} label="تمويل" />
        <BiasDot bias={fundingTrend} label="اتجاه التمويل" />
        <BiasDot bias={oiTrend} label="OI" />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, color }: { label: string; value: string; sub: string; color: "bull" | "bear" | "muted" }) {
  const colorCls = {
    bull: "text-bull",
    bear: "text-bear",
    muted: "text-muted-foreground",
  }[color];
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn("mono font-bold text-lg", colorCls)}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function ConfidenceBadge({ pct }: { pct: number }) {
  if (pct >= 90) return <span className="text-[10px] mono px-2 py-0.5 rounded-full border border-bull/40 bg-bull/10 text-bull">بيانات كاملة</span>;
  if (pct >= 60) return <span className="text-[10px] mono px-2 py-0.5 rounded-full border border-gold/40 bg-gold/10 text-gold">بيانات جزئية</span>;
  return <span className="text-[10px] mono px-2 py-0.5 rounded-full border border-bear/40 bg-bear/10 text-bear">بيانات محدودة</span>;
}

function BiasDot({ bias, label }: { bias: number; label: string }) {
  const cls = bias > 0.2 ? "bg-bull" : bias < -0.2 ? "bg-bear" : "bg-muted-foreground";
  const text = bias > 0.2 ? "صاعد" : bias < -0.2 ? "هابط" : "محايد";
  return (
    <span className="flex items-center gap-1">
      <span className={cn("inline-block size-2 rounded-full", cls)} />
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("font-semibold", bias > 0.2 ? "text-bull" : bias < -0.2 ? "text-bear" : "text-muted-foreground")}>{text}</span>
    </span>
  );
}
