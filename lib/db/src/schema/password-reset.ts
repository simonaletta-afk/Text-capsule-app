import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
