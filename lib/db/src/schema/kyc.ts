import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const kycStatusEnum = pgEnum("kyc_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
  "under_review",
]);

export const verificationMethodEnum = pgEnum("verification_method", [
  "passport",
  "national_id",
  "driver_license",
  "residence_permit",
]);

export const kycTable = pgTable("kyc", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  status: kycStatusEnum("status").notNull().default("pending"),
  
  // Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  nationality: text("nationality").notNull(),
  
  // Address Information
  country: text("country").notNull(),
  state: text("state"),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  streetAddress: text("street_address").notNull(),
  
  // Verification Documents
  documentType: verificationMethodEnum("document_type").notNull(),
  documentNumber: text("document_number").notNull(),
  documentExpiry: text("document_expiry"),
  documentImageFront: text("document_image_front").notNull(),
  documentImageBack: text("document_image_back"),
  
  // Facial Recognition
  selfieImage: text("selfie_image").notNull(),
  facialRecognitionScore: decimal("facial_recognition_score", { precision: 5, scale: 2 }),
  facialRecognitionPassed: boolean("facial_recognition_passed").default(false),
  
  // Verification Status
  documentVerified: boolean("document_verified").default(false),
  addressVerified: boolean("address_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  
  // Liveness Check
  livenessCheckPassed: boolean("liveness_check_passed").default(false),
  livenessCheckDate: timestamp("liveness_check_date", { withTimezone: true }),
  
  // Approval Information
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  
  // Metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const kycHistoryTable = pgTable("kyc_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  kycId: uuid("kyc_id").notNull(),
  userId: text("user_id").notNull(),
  status: kycStatusEnum("status").notNull(),
  action: text("action").notNull(), // "submitted", "approved", "rejected", "updated"
  notes: text("notes"),
  reviewedBy: text("reviewed_by"), // admin user id
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KYC = typeof kycTable.$inferSelect;
export type InsertKYC = typeof kycTable.$inferInsert;
export type KYCHistory = typeof kycHistoryTable.$inferSelect;
export type InsertKYCHistory = typeof kycHistoryTable.$inferInsert;
