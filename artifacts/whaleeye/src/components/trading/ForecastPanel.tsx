/**
 * ForecastPanel — Probabilistic scenario guidance.
 * Derived from real signals. Honest about uncertainty.
 * Does NOT claim to predict prices — only probabilistic bias from current data.
 */
import type { ForecastOutput } from "@/lib/forecast";
import { cn } from "@/lib/utils";
import { fmtPrice } from "@/lib/binance";
import { TrendingUp, TrendingDown, TriangleAlert, Zap, MinusCircle, Info } from "lucide-react";

interface Props { forecast: ForecastOutput | null }

export function ForecastPanel({ forecast }: Props) {
  if (!forecast) {
    return (
      <div className="rounded-xl border border-border bg-card/30 p-4 text-center text-sm text-muted-foreground">
        في انتظار بيانات كافية لبناء التوقع...
      </div>
    );
  }

  const { continuationPct, reversalPct, breakoutWatch, meanReversionWatch,
          trapRisk, invalidationLevel, bestContext, avoidConditions,
          confidence, regime, drivers, contradictions, dataWarning } = forecast;

  const bullBias = continuationPct > reversalPct;

  const regimeLabel: Record<string, string> = {
    trending: "اتجاه", ranging: "تذبذب", volatile: "متقلب", unknown: "غير محدد",
  };
  const regimeColor: Record<string, string> = {
    trending: "text-bull", ranging: "text-gold", volatile: "text-bear", unknown: "text-muted-foreground",
  };

  return (
    <div className="space-y-3">
      {dataWarning && (
        <div className="flex items-center gap-2 text-[11px] text-gold bg-gold/5 border border-gold/20 rounded-lg px-3 py-2">
          <Info className="size-3.5 shrink-0" />
          {dataWarning}
        </div>
      )}

      {/* Probability bars */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">سيناريو الاستمرارية / الانعكاس</span>
          <span className={cn("text-[10px] mono px-2 py-0.5 rounded-full border", regimeColor[regime], "border-current bg-current/10")}>
            {regimeLabel[regime]}
          </span>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mono mb-1">
            <span className="text-bull">استمرار {continuationPct}%</span>
            <span className="text-bear">انعكاس {reversalPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-bull/70 to-bull rounded-l-full transition-all duration-700"
              style={{ width: `${continuationPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-bear to-bear/70 rounded-r-full transition-all duration-700"
              style={{ width: `${reversalPct}%` }}
            />
          </div>
        </div>

        {/* Trap risk */}
        <div>
          <div className="flex justify-between text-[11px] mono mb-1">
            <span className={cn(trapRisk > 60 ? "text-bear" : trapRisk > 40 ? "text-gold" : "text-muted-foreground")}>
              خطر فخ سيولة
            </span>
            <span className={cn("font-bold", trapRisk > 60 ? "text-bear" : trapRisk > 40 ? "text-gold" : "text-bull")}>
              {trapRisk}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700",
                trapRisk > 60 ? "bg-bear" : trapRisk > 40 ? "bg-gold" : "bg-bull/60")}
              style={{ width: `${trapRisk}%` }}
            />
          </div>
        </div>

        {/* Watch badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {breakoutWatch && (
            <span className="flex items-center gap-1 text-[10px] mono px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary">
              <Zap className="size-3" /> مراقبة اختراق
            </span>
          )}
          {meanReversionWatch && (
            <span className="flex items-center gap-1 text-[10px] mono px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold">
              <TrendingDown className="size-3" /> مراقبة انعكاس
            </span>
          )}
          {!breakoutWatch && !meanReversionWatch && (
            <span className="text-[10px] mono text-muted-foreground px-2.5 py-1 rounded-full bg-secondary/20 border border-border">
              لا توجد فرصة عالية الأولوية حاليًا
            </span>
          )}
        </div>
      </div>

      {/* Best context */}
      <div className="rounded-xl border border-border bg-card/40 p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">أفضل سياق للتنفيذ</div>
        <div className="text-sm font-semibold">{bestContext}</div>
        {invalidationLevel > 0 && (
          <div className="text-[11px] mono text-muted-foreground mt-1.5">
            مستوى الإبطال (ATR Stop): <span className="text-bear font-bold">{fmtPrice(invalidationLevel)}</span>
          </div>
        )}
      </div>

      {/* Drivers and contradictions */}
      {(drivers.length > 0 || contradictions.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {drivers.length > 0 && (
            <div className="rounded-xl border border-bull/20 bg-bull/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-bull mb-2 flex items-center gap-1.5">
                <TrendingUp className="size-3" /> عوامل داعمة
              </div>
              <ul className="space-y-1">
                {drivers.map((d, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-bull mt-0.5">●</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contradictions.length > 0 && (
            <div className="rounded-xl border border-bear/20 bg-bear/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-bear mb-2 flex items-center gap-1.5">
                <TriangleAlert className="size-3" /> عوامل متعارضة
              </div>
              <ul className="space-y-1">
                {contradictions.map((c, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-bear mt-0.5">●</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Avoid conditions */}
      <div className="rounded-xl border border-border bg-card/30 p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <MinusCircle className="size-3" /> تجنب الآن
        </div>
        <ul className="space-y-1">
          {avoidConditions.map((a, i) => (
            <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <span className="text-bear/60 mt-0.5">—</span>{a}
            </li>
          ))}
        </ul>
      </div>

      {/* Confidence + disclaimer */}
      <div className="flex items-center justify-between text-[10px] mono text-muted-foreground/60 px-1">
        <span>ثقة التوقع: <span className={cn(confidence > 60 ? "text-bull" : confidence > 35 ? "text-gold" : "text-bear")}>{confidence}%</span></span>
        <span>احتمالية إحصائية · ليست توصية استثمارية</span>
      </div>
    </div>
  );
}
