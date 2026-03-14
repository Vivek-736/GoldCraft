import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  imageUrl: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phoneNumber: varchar({ length: 30 }),
  address: text(),
  credits: integer().notNull().default(4),
  creditsUpdatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const chatsTable = pgTable("chats", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  chatId: varchar({ length: 64 }).notNull().unique(),
  userEmail: varchar({ length: 255 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  chatId: varchar({ length: 64 }).notNull(),
  role: varchar({ length: 20 }).notNull(),
  content: text().notNull(),
  images: text(),
  sources: text(),
  tool: varchar({ length: 20 }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const aiDesignCartItemsTable = pgTable("ai_design_cart_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userEmail: varchar({ length: 255 }).notNull(),
  mode: varchar({ length: 20 }).notNull(),
  prompt: text(),
  sketchUrl: text(),
  outputUrl: text().notNull(),
  estimatedCostInr: integer(),
  estimatedWeightGrams: varchar({ length: 40 }),
  estimateMeta: text(),
  estimatedAt: timestamp({ withTimezone: true }),
  orderPlaced: boolean().notNull().default(false),
  orderPlacedAt: timestamp({ withTimezone: true }),
  razorpayOrderId: varchar({ length: 100 }),
  razorpayPaymentId: varchar({ length: 100 }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});