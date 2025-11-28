import { db } from "./db";
import { 
  type User, type InsertUser, 
  type Strategy, type InsertStrategy,
  type Signal, type InsertSignal,
  type Settings, type InsertSettings,
  type BalanceHistory, type InsertBalanceHistory,
  users, strategies, signals, settings, balanceHistory
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, balance: string): Promise<void>;
  
  getStrategies(userId: string): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: string, updates: Partial<InsertStrategy>): Promise<Strategy | undefined>;
  
  getSignals(userId: string, limit?: number): Promise<Signal[]>;
  createSignal(signal: InsertSignal): Promise<Signal>;
  updateSignal(id: string, status: string): Promise<Signal | undefined>;
  
  getSettings(userId: string): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(userId: string, updates: Partial<InsertSettings>): Promise<Settings | undefined>;
  
  getBalanceHistory(userId: string, limit?: number): Promise<BalanceHistory[]>;
  addBalanceHistory(history: InsertBalanceHistory): Promise<BalanceHistory>;
  
  resetAccount(userId: string): Promise<void>;
}

export class PostgresStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(userId: string, balance: string): Promise<void> {
    await db.update(users).set({ balance }).where(eq(users.id, userId));
  }

  async getStrategies(userId: string): Promise<Strategy[]> {
    return db.select().from(strategies).where(eq(strategies.userId, userId));
  }

  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const [newStrategy] = await db.insert(strategies).values(strategy).returning();
    return newStrategy;
  }

  async updateStrategy(id: string, updates: Partial<InsertStrategy>): Promise<Strategy | undefined> {
    const [updated] = await db.update(strategies).set(updates).where(eq(strategies.id, id)).returning();
    return updated;
  }

  async getSignals(userId: string, limit = 10): Promise<Signal[]> {
    return db.select().from(signals)
      .where(eq(signals.userId, userId))
      .orderBy(desc(signals.createdAt))
      .limit(limit);
  }

  async createSignal(signal: InsertSignal): Promise<Signal> {
    const [newSignal] = await db.insert(signals).values(signal).returning();
    return newSignal;
  }

  async updateSignal(id: string, status: string, updates?: { result?: string; profitLoss?: string; completedAt?: Date }): Promise<Signal | undefined> {
    const updateData: any = { status };
    if (updates?.result) updateData.result = updates.result;
    if (updates?.profitLoss) updateData.profitLoss = updates.profitLoss;
    if (updates?.completedAt) updateData.completedAt = updates.completedAt;
    
    const [updated] = await db.update(signals).set(updateData).where(eq(signals.id, id)).returning();
    return updated;
  }

  async getSettings(userId: string): Promise<Settings | undefined> {
    const [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));
    return userSettings;
  }

  async createSettings(userSettings: InsertSettings): Promise<Settings> {
    const [newSettings] = await db.insert(settings).values(userSettings).returning();
    return newSettings;
  }

  async updateSettings(userId: string, updates: Partial<InsertSettings>): Promise<Settings | undefined> {
    const [updated] = await db.update(settings).set(updates).where(eq(settings.userId, userId)).returning();
    return updated;
  }

  async getBalanceHistory(userId: string, limit = 7): Promise<BalanceHistory[]> {
    return db.select().from(balanceHistory)
      .where(eq(balanceHistory.userId, userId))
      .orderBy(desc(balanceHistory.timestamp))
      .limit(limit);
  }

  async addBalanceHistory(history: InsertBalanceHistory): Promise<BalanceHistory> {
    const [newHistory] = await db.insert(balanceHistory).values(history).returning();
    return newHistory;
  }

  async resetAccount(userId: string): Promise<void> {
    // Delete all signals
    await db.delete(signals).where(eq(signals.userId, userId));
    // Delete all balance history
    await db.delete(balanceHistory).where(eq(balanceHistory.userId, userId));
    // Reset balance to 100
    await db.update(users).set({ balance: "100" }).where(eq(users.id, userId));
  }
}

export const storage = new PostgresStorage();
