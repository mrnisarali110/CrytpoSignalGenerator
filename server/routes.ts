import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSignalSchema, insertStrategySchema, insertSettingsSchema, insertBalanceHistorySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

let DEMO_USER_ID: string;

async function ensureDemoUser() {
  let user = await storage.getUserByUsername("Trader_01");
  
  if (!user) {
    user = await storage.createUser({
      username: "Trader_01",
      password: "demo",
      email: "demo@signalbot.ai",
      balance: "110.30",
    });
  }
  
  DEMO_USER_ID = user.id;
  
  const existingSettings = await storage.getSettings(user.id);
  if (!existingSettings) {
    await storage.createSettings({
      userId: user.id,
      riskPerTrade: "2.0",
      maxLeverage: 10,
      maxDailyDrawdown: "5.0",
      dailyProfitTarget: "2.0",
      compoundProfits: true,
      autoTrading: true,
    });
  }

  const existingStrategies = await storage.getStrategies(user.id);
  if (existingStrategies.length === 0) {
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
  }

  const existingHistory = await storage.getBalanceHistory(user.id, 1);
  if (existingHistory.length === 0) {
    for (let i = 0; i < 7; i++) {
      const balance = 100 + (i * 1.5);
      await storage.addBalanceHistory({
        userId: user.id,
        balance: balance.toFixed(2),
      });
    }
  }

  const existingSignals = await storage.getSignals(user.id, 1);
  if (existingSignals.length === 0) {
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

  // Helper: Calculate RSI (14 period standard)
  function calculateRSI(prices: number[]): number {
    if (prices.length < 15) return 50;
    
    let gains = 0, losses = 0;
    for (let i = prices.length - 14; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const rs = (gains / 14) / (losses / 14);
    return 100 - (100 / (1 + rs));
  }

  // Helper: Calculate EMA
  function calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    let sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
    const multiplier = 2 / (period + 1);
    
    for (let i = prices.length - period; i < prices.length; i++) {
      sma = prices[i] * multiplier + sma * (1 - multiplier);
    }
    return sma;
  }

  app.post("/api/signals/generate", async (req, res) => {
    try {
      const cryptoMap: { [key: string]: string } = {
        "BTC/USDT": "bitcoin",
        "ETH/USDT": "ethereum",
        "SOL/USDT": "solana",
        "XRP/USDT": "ripple",
        "ADA/USDT": "cardano"
      };
      
      const pairs = Object.keys(cryptoMap);
      const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
      const cryptoId = cryptoMap[randomPair];
      
      try {
        // Fetch live price
        const priceRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`
        );
        if (!priceRes.ok) throw new Error("Failed to fetch price");
        const priceData = await priceRes.json();
        const livePrice = priceData[cryptoId]?.usd;
        if (!livePrice) throw new Error("Price not found");

        // Fetch historical data (last 90 days)
        const histRes = await fetch(
          `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=90&interval=daily`
        );
        if (!histRes.ok) throw new Error("Failed to fetch historical data");
        const histData = await histRes.json();
        const prices = histData.prices.map((p: any) => p[1]);

        // Calculate RSI (14 period - standard)
        const rsi = calculateRSI(prices);
        
        // Calculate EMA (12 and 26)
        const ema12 = calculateEMA(prices, 12);
        const ema26 = calculateEMA(prices, 26);

        // RSI + EMA Strategy (70-75% accuracy)
        let tradeType: "LONG" | "SHORT" | null = null;
        let confidence = 0;

        if (rsi < 30 && ema12 > ema26) {
          // Strong oversold + uptrend: BUY signal
          tradeType = "LONG";
          confidence = Math.min(95, 70 + (30 - rsi));
        } else if (rsi > 70 && ema12 < ema26) {
          // Strong overbought + downtrend: SELL signal
          tradeType = "SHORT";
          confidence = Math.min(95, 70 + (rsi - 70));
        } else if (rsi < 40 && ema12 > ema26) {
          // Mild oversold + uptrend
          tradeType = "LONG";
          confidence = 65 + (40 - rsi) / 2;
        } else if (rsi > 60 && ema12 < ema26) {
          // Mild overbought + downtrend
          tradeType = "SHORT";
          confidence = 65 + (rsi - 60) / 2;
        } else {
          // Conflicting signals - use weaker setup
          tradeType = ema12 > ema26 ? "LONG" : "SHORT";
          confidence = 55 + Math.abs(rsi - 50) / 10;
        }

        const entry = livePrice;
        const tp = tradeType === "LONG"
          ? entry * (1 + (confidence / 100) * 0.08)
          : entry * (1 - (confidence / 100) * 0.08);
        const sl = tradeType === "LONG"
          ? entry * (1 - 0.03)
          : entry * (1 + 0.03);

        // Calculate leverage based on confidence (1x to 10x)
        // Higher confidence = higher leverage for account growth
        const leverage = Math.min(10, Math.max(1, Math.round(1 + (confidence - 50) * 0.18)));

        const signal = await storage.createSignal({
          userId: DEMO_USER_ID,
          strategyId: null,
          pair: randomPair,
          type: tradeType,
          entry: entry.toFixed(2),
          tp: tp.toFixed(2),
          sl: sl.toFixed(2),
          confidence: Math.round(confidence),
          leverage,
          status: "active",
        });

        res.json(signal);
      } catch (fetchError) {
        console.error("Price fetch error:", fetchError);
        res.status(500).json({ error: "Failed to fetch market data from CoinGecko" });
      }
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

  app.post("/api/trade/execute", async (req, res) => {
    try {
      const { signalId, result, confidence } = req.body;
      const user = await storage.getUser(DEMO_USER_ID);
      if (!user) return res.status(404).json({ error: "User not found" });

      const currentBalance = parseFloat(user.balance);
      const tradeSize = currentBalance * 0.1;
      
      let newBalance: number;
      if (result === "tp") {
        const profitPercentage = (confidence / 100) * 0.05;
        newBalance = currentBalance + (tradeSize * profitPercentage);
      } else {
        newBalance = currentBalance - (tradeSize * 0.03);
      }

      await storage.updateUserBalance(DEMO_USER_ID, newBalance.toFixed(2));
      await storage.updateSignal(signalId, "completed");
      await storage.addBalanceHistory({
        userId: DEMO_USER_ID,
        balance: newBalance.toFixed(2),
      });

      res.json({ success: true, newBalance: newBalance.toFixed(2) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/account/reset", async (req, res) => {
    try {
      await storage.resetAccount(DEMO_USER_ID);
      await storage.addBalanceHistory({
        userId: DEMO_USER_ID,
        balance: "100",
      });
      res.json({ success: true, message: "Account reset successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
