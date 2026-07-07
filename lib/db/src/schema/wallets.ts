import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  decimal,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const walletTypeEnum = pgEnum("wallet_type", [
  "spot",
  "margin",
  "futures",
  "savings",
  "staking",
  "fiat",
]);

export const walletStatusEnum = pgEnum("wallet_status", [
  "active",
  "frozen",
  "suspended",
  "closed",
]);

export const currencyTypeEnum = pgEnum("currency_type", [
  "crypto",
  "fiat",
]);

export const walletsTable = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  walletType: walletTypeEnum("wallet_type").notNull(),
  currency: text("currency").notNull(), // BTC, ETH, USD, EUR, SAR, AED, etc.
  currencyType: currencyTypeEnum("currency_type").notNull(),
  
  // Balance Information
  balance: decimal("balance", { precision: 20, scale: 8 }).notNull().default("0"),
  availableBalance: decimal("available_balance", { precision: 20, scale: 8 }).notNull().default("0"),
  lockedBalance: decimal("locked_balance", { precision: 20, scale: 8 }).notNull().default("0"),
  
  // Valuation
  balanceInUSD: decimal("balance_in_usd", { precision: 20, scale: 2 }).default("0"),
  
  // Status
  status: walletStatusEnum("status").notNull().default("active"),
  
  // Wallet Address (for crypto)
  walletAddress: text("wallet_address"),
  publicKey: text("public_key"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const walletTransactionTable = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").notNull(),
  userId: text("user_id").notNull(),
  
  transactionType: text("transaction_type").notNull(), // "deposit", "withdrawal", "transfer", "trade", "fee", "reward"
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  
  // For transfers
  fromWalletId: uuid("from_wallet_id"),
  toWalletId: uuid("to_wallet_id"),
  
  // For deposits/withdrawals
  externalAddress: text("external_address"),
  transactionHash: text("transaction_hash"),
  confirmations: text("confirmations"),
  
  status: text("status").notNull(), // "pending", "completed", "failed", "cancelled"
  
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0"),
  feeCurrency: text("fee_currency"),
  
  notes: text("notes"),
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const depositAddressTable = pgTable("deposit_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  walletId: uuid("wallet_id").notNull(),
  
  currency: text("currency").notNull(),
  network: text("network").notNull(), // "ethereum", "bitcoin", "tron", "polygon", etc.
  
  address: text("address").notNull(),
  tag: text("tag"), // For currencies like XRP, XLM
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const withdrawalWhitelistTable = pgTable("withdrawal_whitelist", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  address: text("address").notNull(),
  label: text("label"),
  currency: text("currency").notNull(),
  network: text("network").notNull(),
  
  verified: boolean("verified").notNull().default(false),
  verificationCode: text("verification_code"),
  verificationCodeExpiry: timestamp("verification_code_expiry", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Wallet = typeof walletsTable.$inferSelect;
export type InsertWallet = typeof walletsTable.$inferInsert;
export type WalletTransaction = typeof walletTransactionTable.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactionTable.$inferInsert;
export type DepositAddress = typeof depositAddressTable.$inferSelect;
export type InsertDepositAddress = typeof depositAddressTable.$inferInsert;
export type WithdrawalWhitelist = typeof withdrawalWhitelistTable.$inferSelect;
export type InsertWithdrawalWhitelist = typeof withdrawalWhitelistTable.$inferInsert;
