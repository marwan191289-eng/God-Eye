import { jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const signalLogTable = pgTable("signal_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(),
  entry: numeric("entry", { precision: 20, scale: 8 }).notNull(),
  stop: numeric("stop", { precision: 20, scale: 8 }),
  target: numeric("target", { precision: 20, scale: 8 }),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull().default("0"),
  features: jsonb("features").notNull().default({}),
  outcome: text("outcome"),
  pnlPct: numeric("pnl_pct", { precision: 10, scale: 4 }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SignalLog = typeof signalLogTable.$inferSelect;
export type InsertSignalLog = typeof signalLogTable.$inferInsert;
