import { pgTable, serial, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  frequency: varchar("frequency", { length: 20 }).notNull().default("yearly"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deliverAt: timestamp("deliver_at", { withTimezone: true }).notNull(),
  isDelivered: boolean("is_delivered").notNull().default(false),
  isRead: boolean("is_read").notNull().default(false),
});

export type Message = typeof messagesTable.$inferSelect;
export type InsertMessage = typeof messagesTable.$inferInsert;
