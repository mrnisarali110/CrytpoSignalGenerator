import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("100.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  risk: text("risk").notNull(),
  winRate: integer("win_rate").notNull(),
  avgProfit: decimal("avg_profit", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  totalTrades: integer("total_trades").notNull().default(0),
  profitFactor: decimal("profit_factor", { precision: 5, scale: 2 }).notNull().default("0"),
  maxDrawdown: decimal("max_drawdown", { precision: 5, scale: 2 }).notNull().default("0"),
  minLeverage: integer("min_leverage").notNull().default(1),
  maxLeverage: integer("max_leverage").notNull().default(10),
});

export const signals = pgTable("signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  strategyId: varchar("strategy_id").references(() => strategies.id),
  pair: text("pair").notNull(),
  type: text("type").notNull(),
  entry: text("entry").notNull(),
  tp: text("tp").notNull(),
  sl: text("sl").notNull(),
  confidence: integer("confidence").notNull(),
  leverage: integer("leverage").notNull().default(1),
  status: text("status").notNull().default("active"),
  result: text("result"),
  profitLoss: decimal("profit_loss", { precision: 10, scale: 2 }),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  riskPerTrade: decimal("risk_per_trade", { precision: 3, scale: 1 }).notNull().default("2.0"),
  maxLeverage: integer("max_leverage").notNull().default(10),
  maxDailyDrawdown: decimal("max_daily_drawdown", { precision: 3, scale: 1 }).notNull().default("5.0"),
  dailyProfitTarget: decimal("daily_profit_target", { precision: 3, scale: 1 }).notNull().default("2.0"),
  compoundProfits: boolean("compound_profits").notNull().default(true),
  autoTrading: boolean("auto_trading").notNull().default(true),
});

export const balanceHistory = pgTable("balance_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStrategySchema = createInsertSchema(strategies).omit({ id: true });
export const insertSignalSchema = createInsertSchema(signals).omit({ id: true, createdAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertBalanceHistorySchema = createInsertSchema(balanceHistory).omit({ id: true, timestamp: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Signal = typeof signals.$inferSelect;
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type BalanceHistory = typeof balanceHistory.$inferSelect;
export type InsertBalanceHistory = z.infer<typeof insertBalanceHistorySchema>;
