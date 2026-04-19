import { pgTable, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const bankrollTable = pgTable("bankroll", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  startingBankroll: real("starting_bankroll").notNull().default(0),
  currentBankroll: real("current_bankroll").notNull().default(0),
});

export const insertBankrollSchema = createInsertSchema(bankrollTable);

export type InsertBankroll = z.infer<typeof insertBankrollSchema>;
export type Bankroll = typeof bankrollTable.$inferSelect;
