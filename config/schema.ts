import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  imageUrl: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phoneNumber: varchar({ length: 30 }),
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