/**
 * DataSourcesPanel — Full transparency on what data is connected.
 * Every feed is listed with its true status. No fabrication.
 */
import type { ReactElement } from "react";
import { DATA_SOURCES, CATEGORY_LABELS, STATUS_LABELS, type FeedCategory, type FeedStatus } from "@/lib/data-sources";
import { cn } from "@/lib/utils";
import { Radio, Lock, Info } from "lucide-react";

const CATEGORY_ORDER: FeedCategory[] = [
  "public_exchange", "derivatives", "on_chain", "smart_money", "premium"
];

const categoryColor: Record<FeedCategory, string> = {
  public_exchange: "text-bull",
  derivatives:     "text-primary",
  on_chain:        "text-violet-400",
  smart_money:     "text-gold",
  premium:         "text-muted-foreground",
};

const statusIcon: Record<FeedStatus, ReactElement> = {
  polling:     <Radio className="size-3 text-bull animate-pulse" />,
  websocket:   <Radio className="size-3 text-primary animate-pulse" />,
  unavailable: <Lock  className="size-3 text-muted-foreground/50" />,
  demo:        <Info  className="size-3 text-gold" />,
};

const statusBadge: Record<FeedStatus, string> = {
  polling:     "bg-bull/10 text-bull border-bull/25",
  websocket:   "bg-primary/10 text-primary border-primary/25",
  unavailable: "bg-secondary/20 text-muted-foreground/50 border-border/40",
  demo:        "bg-gold/10 text-gold border-gold/25",
};

export function DataSourcesPanel() {
  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    sources: DATA_SOURCES.filter(s => s.category === cat),
  }));

  const connected = DATA_SOURCES.filter(s => s.status !== "unavailable").length;
  const total     = DATA_SOURCES.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between text-[11px] mono text-muted-foreground">
        <span>{connected}/{total} مصدر متصل</span>
        <span className="text-[10px] opacity-60">البيانات الافتراضية: Binance REST فقط</span>
      </div>

      {grouped.map(({ cat, sources }) => (
        <div key={cat}>
          <div className={cn("text-[10px] uppercase tracking-wider font-bold mb-2", categoryColor[cat])}>
            {CATEGORY_LABELS[cat]}
          </div>
          <div className="space-y-1.5">
            {sources.map(src => (
              <div
                key={src.id}
                className={cn(
                  "rounded-lg border px-3 py-2 flex items-start justify-between gap-3",
                  src.status === "unavailable"
                    ? "border-border/40 bg-card/20 opacity-60"
                    : "border-border bg-card/50"
                )}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="mt-0.5 shrink-0">{statusIcon[src.status]}</span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold truncate">{src.nameAr}</div>
                    <div className="text-[10px] mono text-muted-foreground/70 mt-0.5">
                      {src.provider} · {src.latencyNote}
                    </div>
                    {src.note && (
                      <div className="text-[10px] text-muted-foreground/50 mt-0.5 italic">{src.note}</div>
                    )}
                    {src.panels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {src.panels.map(p => (
                          <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/8 text-primary/60 border border-primary/10">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className={cn("shrink-0 text-[9px] mono px-2 py-1 rounded-full border whitespace-nowrap", statusBadge[src.status])}>
                  {STATUS_LABELS[src.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-border/40 bg-card/20 px-3 py-2 text-[10px] text-muted-foreground/60 leading-relaxed">
        هذه المنصة تستخدم بيانات Binance العامة عبر استطلاع REST (ليس WebSocket حقيقي). 
        البيانات المؤسسية كالمحافظ الضخمة والعقود المفتوحة والتدفقات On-Chain غير متصلة حاليًا.
        كل ادعاء في هذه المنصة مبني على بيانات حقيقية ومتاحة فقط.
      </div>
    </div>
  );
}
