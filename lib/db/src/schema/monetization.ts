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

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "basic",
  "pro",
  "premium",
  "enterprise",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "inactive",
  "cancelled",
  "suspended",
  "expired",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "credit_card",
  "debit_card",
  "bank_transfer",
  "crypto",
  "paypal",
  "stripe",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
  "cancelled",
]);

export const subscriptionPlansTable = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  name: text("name").notNull(),
  tier: subscriptionTierEnum("tier").notNull().unique(),
  
  description: text("description"),
  
  // Pricing
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }),
  
  // Features
  features: jsonb("features").notNull(), // Array of feature strings
  
  // Limits
  maxApiKeys: integer("max_api_keys"),
  maxGridBots: integer("max_grid_bots"),
  maxCopyTradingFollows: integer("max_copy_trading_follows"),
  apiRateLimit: integer("api_rate_limit"),
  
  // Advanced Features
  advancedAnalytics: boolean("advanced_analytics").default(false),
  aiSignals: boolean("ai_signals").default(false),
  copyTrading: boolean("copy_trading").default(false),
  gridBot: boolean("grid_bot").default(false),
  marginTrading: boolean("margin_trading").default(false),
  futuresTrading: boolean("futures_trading").default(false),
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSubscriptionsTable = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  
  planId: uuid("plan_id").notNull(),
  tier: subscriptionTierEnum("tier").notNull(),
  
  status: subscriptionStatusEnum("status").notNull().default("active"),
  
  // Billing
  billingCycle: text("billing_cycle").notNull(), // "monthly", "annual"
  
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  
  // Auto-renewal
  autoRenew: boolean("auto_renew").notNull().default(true),
  
  // Cancellation
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  subscriptionId: uuid("subscription_id"),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(), // "USD", "EUR", "SAR", etc.
  
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  
  // Payment Gateway
  paymentGateway: text("payment_gateway"), // "stripe", "paypal", "crypto", etc.
  transactionId: text("transaction_id"),
  
  // Refund
  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  refundReason: text("refund_reason"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoicesTable = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  paymentId: uuid("payment_id"),
  
  invoiceNumber: text("invoice_number").notNull().unique(),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  
  description: text("description"),
  
  // Invoice Details
  issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  
  status: text("status").notNull(), // "draft", "sent", "paid", "overdue", "cancelled"
  
  // PDF
  pdfUrl: text("pdf_url"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const referralProgramTable = pgTable("referral_program", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  
  referralCode: text("referral_code").notNull().unique(),
  
  // Rewards
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).notNull(),
  totalEarnings: decimal("total_earnings", { precision: 20, scale: 8 }).default("0"),
  
  // Referrals
  totalReferrals: integer("total_referrals").default(0),
  activeReferrals: integer("active_referrals").default(0),
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const referralsTable = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  referrerId: text("referrer_id").notNull(),
  refereeId: text("referee_id").notNull(),
  
  referralCode: text("referral_code").notNull(),
  
  // Reward
  rewardAmount: decimal("reward_amount", { precision: 20, scale: 8 }).default("0"),
  rewardCurrency: text("reward_currency"),
  
  status: text("status").notNull(), // "pending", "active", "inactive"
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const affiliateCommissionsTable = pgTable("affiliate_commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  affiliateId: text("affiliate_id").notNull(),
  
  // Commission Source
  source: text("source").notNull(), // "referral", "trading_fee", "subscription"
  sourceId: uuid("source_id"),
  
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  
  // Status
  status: text("status").notNull(), // "pending", "approved", "paid"
  
  paidAt: timestamp("paid_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tradingFeesTable = pgTable("trading_fees", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: text("user_id").notNull(),
  orderId: uuid("order_id").notNull(),
  
  feeAmount: decimal("fee_amount", { precision: 20, scale: 8 }).notNull(),
  feeCurrency: text("fee_currency").notNull(),
  
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 3 }).notNull(),
  
  tradingMode: text("trading_mode").notNull(), // "spot", "margin", "futures"
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlansTable.$inferInsert;
export type UserSubscription = typeof userSubscriptionsTable.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptionsTable.$inferInsert;
export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;
export type Invoice = typeof invoicesTable.$inferSelect;
export type InsertInvoice = typeof invoicesTable.$inferInsert;
export type ReferralProgram = typeof referralProgramTable.$inferSelect;
export type InsertReferralProgram = typeof referralProgramTable.$inferInsert;
export type Referral = typeof referralsTable.$inferSelect;
export type InsertReferral = typeof referralsTable.$inferInsert;
export type AffiliateCommission = typeof affiliateCommissionsTable.$inferSelect;
export type InsertAffiliateCommission = typeof affiliateCommissionsTable.$inferInsert;
export type TradingFee = typeof tradingFeesTable.$inferSelect;
export type InsertTradingFee = typeof tradingFeesTable.$inferInsert;
