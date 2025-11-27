import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSignalSchema, insertStrategySchema, insertSettingsSchema, insertBalanceHistorySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

const DEMO_USER_ID = "demo-user-001";

async function ensureDemoUser() {
  let user = await storage.getUser(DEMO_USER_ID);
  if (!user) {
    user = await storage.createUser({
      username: "Trader_01",
      password: "demo",
      email: "demo@signalbot.ai",
      balance: "110.30",
    });
    
    await storage.createSettings({
      userId: user.id,
      riskPerTrade: "2.0",
      maxLeverage: 10,
      maxDailyDrawdown: "5.0",
      dailyProfitTarget: "2.0",
      compoundProfits: true,
      autoTrading: true,
    });

    const strategiesData = [
      {
        userId: user.id,
        name: "Micro-Scalp v2",
        description: "High-frequency signals for small price movements. Best for volatile markets.",
        risk: "High",
        winRate: 78,
        avgProfit: "1.2",
        active: true,
        totalTrades: 142,
        profitFactor: "2.1",
        maxDrawdown: "4.5"
      },
      {
        userId: user.id,
        name: "Trend Master",
        description: "Follows major 4H market trends. Fewer trades, higher reliability.",
        risk: "Low",
        winRate: 85,
        avgProfit: "3.5",
        active: true,
        totalTrades: 24,
        profitFactor: "3.8",
        maxDrawdown: "1.2"
      },
      {
        userId: user.id,
        name: "Sentiment AI",
        description: "Experimental strategy based on social volume and news sentiment.",
        risk: "Med",
        winRate: 62,
        avgProfit: "5.1",
        active: false,
        totalTrades: 12,
        profitFactor: "1.5",
        maxDrawdown: "8.2"
      }
    ];

    for (const strategy of strategiesData) {
      await storage.createStrategy(strategy);
    }

    for (let i = 0; i < 7; i++) {
      const balance = 100 + (i * 1.5);
      await storage.addBalanceHistory({
        userId: user.id,
        balance: balance.toFixed(2),
      });
    }

    const signalsData = [
      {
        userId: user.id,
        strategyId: null,
        pair: "BTC/USDT",
        type: "LONG",
        entry: "94,250.00",
        tp: "95,100.00",
        sl: "93,800.00",
        confidence: 92,
        status: "active"
      },
      {
        userId: user.id,
        strategyId: null,
        pair: "ETH/USDT",
        type: "SHORT",
        entry: "3,450.50",
        tp: "3,380.00",
        sl: "3,490.00",
        confidence: 88,
        status: "active"
      },
      {
        userId: user.id,
        strategyId: null,
        pair: "SOL/USDT",
        type: "LONG",
        entry: "142.20",
        tp: "145.00",
        sl: "140.50",
        confidence: 85,
        status: "completed"
      }
    ];

    for (const signal of signalsData) {
      await storage.createSignal(signal);
    }
  }
  return user;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await ensureDemoUser();

  app.get("/api/signals", async (req, res) => {
    try {
      const signals = await storage.getSignals(DEMO_USER_ID, 20);
      res.json(signals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/signals", async (req, res) => {
    try {
      const result = insertSignalSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const signal = await storage.createSignal({
        ...result.data,
        userId: DEMO_USER_ID,
      });
      res.json(signal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/signals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const signal = await storage.updateSignal(id, status);
      if (!signal) {
        return res.status(404).json({ error: "Signal not found" });
      }
      res.json(signal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/strategies", async (req, res) => {
    try {
      const strategies = await storage.getStrategies(DEMO_USER_ID);
      res.json(strategies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/strategies", async (req, res) => {
    try {
      const result = insertStrategySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const strategy = await storage.createStrategy({
        ...result.data,
        userId: DEMO_USER_ID,
      });
      res.json(strategy);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/strategies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const strategy = await storage.updateStrategy(id, req.body);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json(strategy);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings(DEMO_USER_ID);
      res.json(settings || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateSettings(DEMO_USER_ID, req.body);
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/balance-history", async (req, res) => {
    try {
      const history = await storage.getBalanceHistory(DEMO_USER_ID, 7);
      res.json(history.reverse());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(DEMO_USER_ID);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
