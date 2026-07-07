import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  decimal,
  jsonb,
  pgEnum,
  integer,
  bigint,
} from "drizzle-orm/pg-core";

export const signalStrengthEnum = pgEnum("signal_strength", [
  "very_weak",
  "weak",
  "neutral",
  "strong",
  "very_strong",
]);

export const signalTypeEnum = pgEnum("signal_type", [
  "buy",
  "sell",
  "strong_buy",
  "strong_sell",
  "neutral",
  "hold",
]);

export const timeframeEnum = pgEnum("timeframe", [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
  "1w",
  "1M",
]);

export const candleTable = pgTable("candles", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  symbol: text("symbol").notNull(),
  timeframe: timeframeEnum("timeframe").notNull(),
  
  openTime: bigint("open_time", { mode: "number" }).notNull(),
  closeTime: bigint("close_time", { mode: "number" }).notNull(),
  
  open: decimal("open", { precision: 20, scale: 8 }).notNull(),
  high: decimal("high", { precision: 20, scale: 8 }).notNull(),
  low: decimal("low", { precision: 20, scale: 8 }).notNull(),
  close: decimal("close", { precision: 20, scale: 8 }).notNull(),
  
  volume: decimal("volume", { precision: 20, scale: 8 }).notNull(),
  quoteAssetVolume: decimal("quote_asset_volume", { precision: 20, scale: 8 }).notNull(),
  
  numberOfTrades: integer("number_of_trades"),
  takerBuyBaseAssetVolume: decimal("taker_buy_base_asset_volume", { precision: 20, scale: 8 }),
  takerBuyQuoteAssetVolume: decimal("taker_buy_quote_asset_volume", { precision: 20, scale: 8 }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const technicalIndicatorsTable = pgTable("technical_indicators", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  symbol: text("symbol").notNull(),
  timeframe: timeframeEnum("timeframe").notNull(),
  
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  
  // Moving Averages
  sma20: decimal("sma20", { precision: 20, scale: 8 }),
  sma50: decimal("sma50", { precision: 20, scale: 8 }),
  sma200: decimal("sma200", { precision: 20, scale: 8 }),
  ema12: decimal("ema12", { precision: 20, scale: 8 }),
  ema26: decimal("ema26", { precision: 20, scale: 8 }),
  
  // Momentum
  rsi: decimal("rsi", { precision: 5, scale: 2 }),
  macd: decimal("macd", { precision: 20, scale: 8 }),
  macdSignal: decimal("macd_signal", { precision: 20, scale: 8 }),
  macdHistogram: decimal("macd_histogram", { precision: 20, scale: 8 }),
  
  // Volatility
  bollingerBandUpper: decimal("bollinger_band_upper", { precision: 20, scale: 8 }),
  bollingerBandMiddle: decimal("bollinger_band_middle", { precision: 20, scale: 8 }),
  bollingerBandLower: decimal("bollinger_band_lower", { precision: 20, scale: 8 }),
  atr: decimal("atr", { precision: 20, scale: 8 }),
  
  // Volume
  obv: decimal("obv", { precision: 20, scale: 8 }),
  adl: decimal("adl", { precision: 20, scale: 8 }),
  
  // Other
  stochastic: jsonb("stochastic"),
  williams: decimal("williams", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiSignalsTable = pgTable("ai_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  symbol: text("symbol").notNull(),
  timeframe: timeframeEnum("timeframe").notNull(),
  
  signalType: signalTypeEnum("signal_type").notNull(),
  strength: signalStrengthEnum("strength").notNull(),
  
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  
  // Analysis Details
  technicalScore: decimal("technical_score", { precision: 5, scale: 2 }),
  fundamentalScore: decimal("fundamental_score", { precision: 5, scale: 2 }),
  sentimentScore: decimal("sentiment_score", { precision: 5, scale: 2 }),
  
  // Recommended Entry/Exit
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }),
  targetPrice: decimal("target_price", { precision: 20, scale: 8 }),
  stopLossPrice: decimal("stop_loss_price", { precision: 20, scale: 8 }),
  
  // Analysis
  analysis: text("analysis"),
  reasoning: jsonb("reasoning"),
  
  // Metadata
  modelVersion: text("model_version"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const marketSentimentTable = pgTable("market_sentiment", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  symbol: text("symbol").notNull(),
  
  // Sentiment Scores
  socialSentiment: decimal("social_sentiment", { precision: 5, scale: 2 }),
  newsSentiment: decimal("news_sentiment", { precision: 5, scale: 2 }),
  onChainSentiment: decimal("on_chain_sentiment", { precision: 5, scale: 2 }),
  
  // Volume Analysis
  volumeScore: decimal("volume_score", { precision: 5, scale: 2 }),
  
  // Fear & Greed Index
  fearGreedIndex: decimal("fear_greed_index", { precision: 5, scale: 2 }),
  
  // Whale Activity
  whaleActivityScore: decimal("whale_activity_score", { precision: 5, scale: 2 }),
  
  // Overall
  overallSentiment: text("overall_sentiment"), // "very_negative", "negative", "neutral", "positive", "very_positive"
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderBookTable = pgTable("order_book", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  symbol: text("symbol").notNull(),
  
  // Bids
  bids: jsonb("bids").notNull(), // Array of [price, quantity]
  
  // Asks
  asks: jsonb("asks").notNull(), // Array of [price, quantity]
  
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const liquidationMapTable = pgTable("liquidation_map", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  symbol: text("symbol").notNull(),
  
  // Price levels with liquidation volume
  priceLevel: decimal("price_level", { precision: 20, scale: 8 }).notNull(),
  liquidationVolume: decimal("liquidation_volume", { precision: 20, scale: 8 }).notNull(),
  
  side: text("side").notNull(), // "long", "short"
  
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const priceAlertTable = pgTable("price_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  symbol: text("symbol").notNull(),
  
  // Alert Conditions
  triggerPrice: decimal("trigger_price", { precision: 20, scale: 8 }).notNull(),
  condition: text("condition").notNull(), // "above", "below"
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isTriggered: boolean("is_triggered").notNull().default(false),
  
  triggeredAt: timestamp("triggered_at", { withTimezone: true }),
  
  // Notification
  notificationSent: boolean("notification_sent").default(false),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Candle = typeof candleTable.$inferSelect;
export type InsertCandle = typeof candleTable.$inferInsert;
export type TechnicalIndicators = typeof technicalIndicatorsTable.$inferSelect;
export type InsertTechnicalIndicators = typeof technicalIndicatorsTable.$inferInsert;
export type AISignal = typeof aiSignalsTable.$inferSelect;
export type InsertAISignal = typeof aiSignalsTable.$inferInsert;
export type MarketSentiment = typeof marketSentimentTable.$inferSelect;
export type InsertMarketSentiment = typeof marketSentimentTable.$inferInsert;
export type OrderBook = typeof orderBookTable.$inferSelect;
export type InsertOrderBook = typeof orderBookTable.$inferInsert;
export type LiquidationMap = typeof liquidationMapTable.$inferSelect;
export type InsertLiquidationMap = typeof liquidationMapTable.$inferInsert;
export type PriceAlert = typeof priceAlertTable.$inferSelect;
export type InsertPriceAlert = typeof priceAlertTable.$inferInsert;
