import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------------------------------- enums --------------------------------- */
export const roleEnum = pgEnum("role", ["customer", "admin"]);
export const productTypeEnum = pgEnum("product_type", [
  "ebook",
  "course",
  "tutorial",
  "service",
  "bundle",
]);
export const levelEnum = pgEnum("level", ["beginner", "intermediate", "advanced"]);
export const publishStatusEnum = pgEnum("publish_status", ["draft", "published"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "timeout",
  "cancelled",
]);
export const paymentProviderEnum = pgEnum("payment_provider", ["mpesa", "paystack", "mock"]);
export const paymentMethodEnum = pgEnum("payment_method", ["mpesa", "card", "free"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "pending",
  "confirmed",
  "unsubscribed",
]);
export const couponTypeEnum = pgEnum("coupon_type", ["percent", "fixed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ---------------------------------- types --------------------------------- */
export type ImageRef = { url: string; alt: string; width?: number; height?: number };
export type TocSection = { title: string; items?: string[] };
export type Faq = { q: string; a: string };
export type ChangelogEntry = { date: string; note: string };
export type Format = "PDF" | "EPUB" | "Video" | "Live" | "Service";
export type LessonResource = { title: string; fileKey: string };

/* ---------------------------------- users --------------------------------- */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  phone: text("phone"),
  role: roleEnum("role").notNull().default("customer"),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const loginTokens = pgTable(
  "login_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    redirectTo: text("redirect_to"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_tokens_email_idx").on(t.email)],
);

/* -------------------------------- catalogue ------------------------------- */
export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    type: productTypeEnum("type").notNull().default("ebook"),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => categories.slug),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    description: text("description").notNull().default(""),
    level: levelEnum("level").notNull().default("beginner"),
    /** Whole Kenyan shillings. 0 + isFree=false means "price coming soon". */
    priceKes: integer("price_kes").notNull().default(0),
    salePriceKes: integer("sale_price_kes"),
    isFree: boolean("is_free").notNull().default(false),
    status: publishStatusEnum("status").notNull().default("draft"),
    /** Rows (or sample prices) that exist only for development/demo. Hidden in production. */
    isSample: boolean("is_sample").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    cover: jsonb("cover").$type<ImageRef | null>(),
    previewImages: jsonb("preview_images").$type<ImageRef[]>().notNull().default([]),
    outcomes: jsonb("outcomes").$type<string[]>().notNull().default([]),
    audienceFor: jsonb("audience_for").$type<string[]>().notNull().default([]),
    audienceNotFor: jsonb("audience_not_for").$type<string[]>().notNull().default([]),
    toc: jsonb("toc").$type<TocSection[]>().notNull().default([]),
    faqs: jsonb("faqs").$type<Faq[]>().notNull().default([]),
    formats: jsonb("formats").$type<Format[]>().notNull().default([]),
    pages: integer("pages"),
    language: text("language").notNull().default("English"),
    author: text("author").notNull().default("Akwasuccess"),
    lastUpdatedOn: date("last_updated_on"),
    changelog: jsonb("changelog").$type<ChangelogEntry[]>().notNull().default([]),
    /** Storage key of the free sample chapter (public bucket or /public path). */
    sampleFileKey: text("sample_file_key"),
    /** For bundles: the product ids included. */
    bundleItems: jsonb("bundle_items").$type<string[]>().notNull().default([]),
    popularity: integer("popularity").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ...timestamps,
  },
  (t) => [
    index("products_category_idx").on(t.categorySlug),
    index("products_status_idx").on(t.status),
  ],
);

export const productFiles = pgTable("product_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  format: text("format").notNull(), // PDF | EPUB | ...
  fileKey: text("file_key").notNull(),
  fileName: text("file_name").notNull(),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------------- commerce ------------------------------- */
export const coupons = pgTable("coupons", {
  code: text("code").primaryKey(),
  type: couponTypeEnum("type").notNull(),
  value: integer("value").notNull(),
  active: boolean("active").notNull().default(true),
  minSubtotalKes: integer("min_subtotal_kes").notNull().default(0),
  maxRedemptions: integer("max_redemptions"),
  redemptions: integer("redemptions").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id),
    email: text("email").notNull(),
    phone: text("phone"),
    name: text("name"),
    status: orderStatusEnum("status").notNull().default("pending"),
    subtotalKes: integer("subtotal_kes").notNull(),
    discountKes: integer("discount_kes").notNull().default(0),
    totalKes: integer("total_kes").notNull(),
    couponCode: text("coupon_code"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    receiptSentAt: timestamp("receipt_sent_at", { withTimezone: true }),
    /** 0 = none sent, 1 = 1-hour reminder sent, 2 = 24-hour reminder sent. */
    abandonedStage: integer("abandoned_stage").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  title: text("title").notNull(),
  unitPriceKes: integer("unit_price_kes").notNull(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    amountKes: integer("amount_kes").notNull(),
    /** Our reference, sent to the provider. */
    reference: text("reference").notNull().unique(),
    /** Provider reference (e.g. M-Pesa CheckoutRequestID, receipt number). */
    providerRef: text("provider_ref"),
    receiptNumber: text("receipt_number"),
    phone: text("phone"),
    failureReason: text("failure_reason"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("payments_provider_ref_idx").on(t.providerRef)],
);

/** Log of provider events. `dedupeKey` makes webhook processing idempotent. */
export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "cascade" }),
  provider: paymentProviderEnum("provider").notNull(),
  type: text("type").notNull(),
  dedupeKey: text("dedupe_key").notNull().unique(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    orderId: uuid("order_id").references(() => orders.id),
    source: text("source").notNull().default("purchase"), // purchase | manual | free
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("entitlements_user_product_uq").on(t.userId, t.productId)],
);

export const downloads = pgTable(
  "downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entitlementId: uuid("entitlement_id")
      .notNull()
      .references(() => entitlements.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productFileId: uuid("product_file_id")
      .notNull()
      .references(() => productFiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("downloads_user_idx").on(t.userId, t.createdAt)],
);

/* --------------------------------- learning ------------------------------- */
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .unique()
    .references(() => products.id, { onDelete: "cascade" }),
  certificateEnabled: boolean("certificate_enabled").notNull().default(true),
});

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  durationSec: integer("duration_sec").notNull().default(0),
  videoProvider: text("video_provider"), // mux | bunny | youtube | null
  videoId: text("video_id"),
  isPreview: boolean("is_preview").notNull().default(false),
  body: text("body").notNull().default(""),
  resources: jsonb("resources").$type<LessonResource[]>().notNull().default([]),
});

export const progress = pgTable(
  "progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** A lesson id, or a learning-path step id such as "crypto-3". */
    itemId: text("item_id").notNull(),
    kind: text("kind").notNull().default("lesson"), // lesson | path
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.itemId] })],
);

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body").notNull(),
  displayName: text("display_name").notNull(),
  verified: boolean("verified").notNull().default(true),
  status: reviewStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------------- content -------------------------------- */
export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  categorySlug: text("category_slug").references(() => categories.slug),
  level: levelEnum("level").notNull().default("beginner"),
  author: text("author").notNull().default("Akwasuccess"),
  status: publishStatusEnum("status").notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  keyTakeaways: jsonb("key_takeaways").$type<string[]>().notNull().default([]),
  relatedProductSlug: text("related_product_slug"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps,
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  location: text("location"),
  productUsed: text("product_used"),
  quote: text("quote").notNull(),
  consent: boolean("consent").notNull().default(false),
  status: reviewStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------ leads & requests --------------------------- */
export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  status: subscriberStatusEnum("status").notNull().default("pending"),
  source: text("source"),
  token: text("token").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quoteRequests = pgTable("quote_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  location: text("location").notNull(),
  serviceType: text("service_type").notNull(),
  description: text("description").notNull(),
  photoKeys: jsonb("photo_keys").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  packageId: text("package_id").notNull(),
  preferredDate: text("preferred_date"),
  notes: text("notes"),
  status: text("status").notNull().default("requested"),
  orderId: uuid("order_id").references(() => orders.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------------------------- system -------------------------------- */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  data: jsonb("data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
