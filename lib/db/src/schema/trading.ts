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
} from "drizzle-orm/pg-core";

export const orderTypeEnum = pgEnum("order_type", [
  "limit",
  "market",
  "stop_loss",
  "take_profit",
  "stop_limit",
  "trailing_stop",
  "iceberg",
  "post_only",
]);

export const orderSideEnum = pgEnum("order_side", ["buy", "sell"]);

export const orderStatusEnum = pgEnum("order_status", [
  "open",
  "partially_filled",
  "filled",
  "cancelled",
  "rejected",
  "expired",
]);

export const tradingModeEnum = pgEnum("trading_mode", [
  "spot",
  "margin",
  "futures",
  "options",
]);

export const leverageEnum = pgEnum("leverage", [
  "1x",
  "2x",
  "3x",
  "5x",
  "10x",
  "20x",
  "50x",
  "100x",
]);

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  // Trading Pair
  symbol: text("symbol").notNull(), // "BTCUSDT", "ETHUSDT", etc.
  baseAsset: text("base_asset").notNull(),
  quoteAsset: text("quote_asset").notNull(),
  
  // Order Details
  orderType: orderTypeEnum("order_type").notNull(),
  side: orderSideEnum("side").notNull(),
  status: orderStatusEnum("status").notNull().default("open"),
  
  // Quantities
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  executedQuantity: decimal("executed_quantity", { precision: 20, scale: 8 }).default("0"),
  remainingQuantity: decimal("remaining_quantity", { precision: 20, scale: 8 }).notNull(),
  
  // Pricing
  price: decimal("price", { precision: 20, scale: 8 }),
  averagePrice: decimal("average_price", { precision: 20, scale: 8 }).default("0"),
  
  // Stop Loss / Take Profit
  stopPrice: decimal("stop_price", { precision: 20, scale: 8 }),
  takeProfitPrice: decimal("take_profit_price", { precision: 20, scale: 8 }),
  
  // Margin / Futures
  tradingMode: tradingModeEnum("trading_mode").notNull().default("spot"),
  leverage: leverageEnum("leverage").default("1x"),
  marginType: text("margin_type"), // "isolated", "cross"
  
  // Fees
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0"),
  feeCurrency: text("fee_currency"),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  filledAt: timestamp("filled_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  
  // Metadata
  clientOrderId: text("client_order_id"),
  metadata: jsonb("metadata"),
});

export const tradesTable = pgTable("trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  orderId: uuid("order_id").notNull(),
  
  symbol: text("symbol").notNull(),
  baseAsset: text("base_asset").notNull(),
  quoteAsset: text("quote_asset").notNull(),
  
  side: orderSideEnum("side").notNull(),
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  
  // Total value
  total: decimal("total", { precision: 20, scale: 8 }).notNull(),
  
  // Fees
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0"),
  feeCurrency: text("fee_currency"),
  
  // Trading Mode
  tradingMode: tradingModeEnum("trading_mode").notNull().default("spot"),
  leverage: leverageEnum("leverage").default("1x"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const positionsTable = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  symbol: text("symbol").notNull(),
  baseAsset: text("base_asset").notNull(),
  quoteAsset: text("quote_asset").notNull(),
  
  side: orderSideEnum("side").notNull(),
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 20, scale: 8 }).notNull(),
  
  // P&L
  unrealizedPnL: decimal("unrealized_pnl", { precision: 20, scale: 8 }).default("0"),
  unrealizedPnLPercentage: decimal("unrealized_pnl_percentage", { precision: 5, scale: 2 }).default("0"),
  realizedPnL: decimal("realized_pnl", { precision: 20, scale: 8 }).default("0"),
  
  // Leverage
  leverage: leverageEnum("leverage").default("1x"),
  marginType: text("margin_type"), // "isolated", "cross"
  
  // Stop Loss / Take Profit
  stopLossPrice: decimal("stop_loss_price", { precision: 20, scale: 8 }),
  takeProfitPrice: decimal("take_profit_price", { precision: 20, scale: 8 }),
  
  // Liquidation
  liquidationPrice: decimal("liquidation_price", { precision: 20, scale: 8 }),
  
  // Status
  isOpen: boolean("is_open").notNull().default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const gridBotTable = pgTable("grid_bots", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  
  // Grid Configuration
  gridType: text("grid_type").notNull(), // "long", "short", "neutral"
  gridCount: integer("grid_count").notNull(),
  
  lowerPrice: decimal("lower_price", { precision: 20, scale: 8 }).notNull(),
  upperPrice: decimal("upper_price", { precision: 20, scale: 8 }).notNull(),
  
  investmentAmount: decimal("investment_amount", { precision: 20, scale: 8 }).notNull(),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Performance
  totalProfit: decimal("total_profit", { precision: 20, scale: 8 }).default("0"),
  totalTrades: integer("total_trades").default(0),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const copyTradingTable = pgTable("copy_trading", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: text("follower_id").notNull(),
  leaderId: text("leader_id").notNull(),
  
  symbol: text("symbol"),
  
  // Copy Settings
  copyRatio: decimal("copy_ratio", { precision: 5, scale: 2 }).notNull().default("1"),
  maxCopyAmount: decimal("max_copy_amount", { precision: 20, scale: 8 }),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Performance
  totalCopiedTrades: integer("total_copied_trades").default(0),
  totalProfit: decimal("total_profit", { precision: 20, scale: 8 }).default("0"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;
export type Trade = typeof tradesTable.$inferSelect;
export type InsertTrade = typeof tradesTable.$inferInsert;
export type Position = typeof positionsTable.$inferSelect;
export type InsertPosition = typeof positionsTable.$inferInsert;
export type GridBot = typeof gridBotTable.$inferSelect;
export type InsertGridBot = typeof gridBotTable.$inferInsert;
export type CopyTrading = typeof copyTradingTable.$inferSelect;
export type InsertCopyTrading = typeof copyTradingTable.$inferInsert;
