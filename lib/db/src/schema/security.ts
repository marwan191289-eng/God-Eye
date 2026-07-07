import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const twoFactorMethodEnum = pgEnum("two_factor_method", [
  "authenticator",
  "sms",
  "email",
]);

export const loginMethodEnum = pgEnum("login_method", [
  "email",
  "phone",
  "google",
  "apple",
  "metamask",
]);

export const securityEventTypeEnum = pgEnum("security_event_type", [
  "login_success",
  "login_failed",
  "password_changed",
  "2fa_enabled",
  "2fa_disabled",
  "withdrawal_request",
  "api_key_created",
  "api_key_deleted",
  "ip_whitelist_added",
  "ip_whitelist_removed",
  "suspicious_activity",
  "account_locked",
  "account_unlocked",
]);

export const twoFactorTable = pgTable("two_factor", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),

  method: twoFactorMethodEnum("method").notNull(),

  // For authenticator apps.
  // SECURITY: TOTP seed MUST be encrypted at rest (AES-256-GCM with a
  // server-side key) before being written here, and decrypted only when
  // validating a TOTP code. Never store the raw seed.
  secretCiphertext: text("secret_ciphertext"),
  secretIv: text("secret_iv"),
  secretAuthTag: text("secret_auth_tag"),

  // SECURITY: Each backup code MUST be hashed with bcrypt/argon2 before
  // being stored. On redemption, hash the submitted code and compare,
  // then invalidate the matching entry. Never store raw backup codes.
  backupCodeHashes: jsonb("backup_code_hashes"), // string[] of hashes

  // For SMS/Email
  phoneNumber: text("phone_number"),

  isEnabled: boolean("is_enabled").notNull().default(false),
  enabledAt: timestamp("enabled_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiKeysTable = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),

  name: text("name").notNull(),

  // Display-only prefix for the public api_key (e.g. "sk_live_abc..."),
  // shown back to the user so they can recognize the key in lists.
  apiKeyPrefix: text("api_key_prefix").notNull(),

  // SECURITY: Store only a bcrypt/argon2 hash of the api_key. The raw
  // value is shown to the user exactly once at creation time; on every
  // subsequent request hash the incoming value and compare.
  apiKeyHash: text("api_key_hash").notNull().unique(),

  // SECURITY: api_secret is also hashed with bcrypt/argon2. The raw
  // secret is shown to the user once at creation and never persisted.
  apiSecretHash: text("api_secret_hash").notNull(),

  // Permissions
  permissions: jsonb("permissions").notNull(), // ["read", "trade", "withdraw"]

  // IP Whitelist
  ipWhitelist: jsonb("ip_whitelist"), // Array of IPs

  // Rate Limiting
  rateLimit: integer("rate_limit").default(1200), // requests per minute

  // Status
  isActive: boolean("is_active").notNull().default(true),

  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ipWhitelistTable = pgTable("ip_whitelist", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  ipAddress: text("ip_address").notNull(),
  label: text("label"),
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginHistoryTable = pgTable("login_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  method: loginMethodEnum("method").notNull(),
  
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  
  deviceName: text("device_name"),
  deviceType: text("device_type"), // "mobile", "desktop", "tablet"
  
  country: text("country"),
  city: text("city"),
  
  status: text("status").notNull(), // "success", "failed"
  failureReason: text("failure_reason"),
  
  twoFactorUsed: boolean("two_factor_used").default(false),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const securityEventsTable = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  eventType: securityEventTypeEnum("event_type").notNull(),
  
  description: text("description"),
  
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accountLockTable = pgTable("account_lock", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  
  reason: text("reason").notNull(),
  
  lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
  
  isActive: boolean("is_active").notNull().default(true),
});

export const deviceFingerprintTable = pgTable("device_fingerprint", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  fingerprint: text("fingerprint").notNull(),
  deviceName: text("device_name"),
  
  isVerified: boolean("is_verified").notNull().default(false),
  
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const withdrawalApprovalTable = pgTable("withdrawal_approval", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  address: text("address").notNull(),
  
  status: text("status").notNull(), // "pending", "approved", "rejected"
  
  approvalCode: text("approval_code"),
  approvalCodeExpiry: timestamp("approval_code_expiry", { withTimezone: true }),
  
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TwoFactor = typeof twoFactorTable.$inferSelect;
export type InsertTwoFactor = typeof twoFactorTable.$inferInsert;
export type APIKey = typeof apiKeysTable.$inferSelect;
export type InsertAPIKey = typeof apiKeysTable.$inferInsert;
export type IPWhitelist = typeof ipWhitelistTable.$inferSelect;
export type InsertIPWhitelist = typeof ipWhitelistTable.$inferInsert;
export type LoginHistory = typeof loginHistoryTable.$inferSelect;
export type InsertLoginHistory = typeof loginHistoryTable.$inferInsert;
export type SecurityEvent = typeof securityEventsTable.$inferSelect;
export type InsertSecurityEvent = typeof securityEventsTable.$inferInsert;
export type AccountLock = typeof accountLockTable.$inferSelect;
export type InsertAccountLock = typeof accountLockTable.$inferInsert;
export type DeviceFingerprint = typeof deviceFingerprintTable.$inferSelect;
export type InsertDeviceFingerprint = typeof deviceFingerprintTable.$inferInsert;
export type WithdrawalApproval = typeof withdrawalApprovalTable.$inferSelect;
export type InsertWithdrawalApproval = typeof withdrawalApprovalTable.$inferInsert;
