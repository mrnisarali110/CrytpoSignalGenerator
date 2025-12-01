// WIN OR DIE: Ultra-High Precision Strategy
// Multi-indicator confirmation for high-leverage, high-reward trades

export interface StrategyResults {
  confidence: number;
  tradeType: "LONG" | "SHORT";
}

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

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  let sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  const multiplier = 2 / (period + 1);
  for (let i = prices.length - period; i < prices.length; i++) {
    sma = prices[i] * multiplier + sma * (1 - multiplier);
  }
  return sma;
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const recentPrices = prices.slice(-9);
  let signalEMA = recentPrices.reduce((a, b) => a + b, 0) / 9;
  const multiplier = 2 / 10;
  signalEMA = macd * multiplier + signalEMA * (1 - multiplier);
  const histogram = macd - signalEMA;
  return { macd, signal: signalEMA, histogram };
}

function calculateStochastic(prices: number[], period: number = 14): { k: number; d: number } {
  if (prices.length < period) return { k: 50, d: 50 };
  const recentPrices = prices.slice(-period);
  const highest = Math.max(...recentPrices);
  const lowest = Math.min(...recentPrices);
  const currentPrice = prices[prices.length - 1];
  const k = ((currentPrice - lowest) / (highest - lowest)) * 100 || 50;
  const d = Math.max(55, Math.min(45, k));
  return { k: Math.max(0, Math.min(100, k)), d };
}

function calculateADX(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  let trueRange = 0;
  let upMove = 0, downMove = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const high = Math.max(prices[i], prices[i - 1] || prices[i]);
    const low = Math.min(prices[i], prices[i - 1] || prices[i]);
    trueRange += (high - low);
    
    const change = prices[i] - (prices[i - 1] || prices[i]);
    if (change > 0) upMove += change;
    if (change < 0) downMove += Math.abs(change);
  }
  
  const atr = trueRange / period;
  const diPlus = (upMove / atr) * 100 / period;
  const diMinus = (downMove / atr) * 100 / period;
  const di = Math.abs(diPlus - diMinus) / (diPlus + diMinus + 0.001);
  return Math.max(20, Math.min(80, 50 + (di * 30)));
}

export function analyzeSignal(prices: number[]): StrategyResults {
  if (prices.length < 40) {
    return { confidence: 55, tradeType: "LONG" };
  }

  const rsi = calculateRSI(prices);
  const { macd, signal: macdSignal, histogram } = calculateMACD(prices);
  const stoch = calculateStochastic(prices);
  const adx = calculateADX(prices);
  
  const ema9 = calculateEMA(prices, 9);
  const ema21 = calculateEMA(prices, 21);
  const ema50 = calculateEMA(prices, 50);
  const currentPrice = prices[prices.length - 1];
  
  const ema9Above21 = ema9 > ema21;
  const ema21Above50 = ema21 > ema50;
  const priceAboveEMA50 = currentPrice > ema50;

  let confidence = 0;
  let tradeType: "LONG" | "SHORT" = "LONG";

  // === EXTREME LONG: All indicators aligned uptrend ===
  if (
    ema9Above21 && ema21Above50 && priceAboveEMA50 &&
    macd > macdSignal && histogram > 0 &&
    stoch.k > 20 && stoch.k < 80 && rsi > 40 && rsi < 70 &&
    adx > 55
  ) {
    tradeType = "LONG";
    confidence = 75;
  }
  // STRONG LONG: Multiple indicators agree uptrend
  else if (
    ema9Above21 && ema21Above50 &&
    macd > macdSignal && histogram > 0 &&
    rsi > 40 && rsi < 70 &&
    adx > 50
  ) {
    tradeType = "LONG";
    confidence = 70;
  }
  // MODERATE LONG: Trend confirmation
  else if (ema9Above21 && macd > macdSignal && rsi > 45 && rsi < 65) {
    tradeType = "LONG";
    confidence = 62;
  }

  // === EXTREME SHORT: All indicators aligned downtrend ===
  else if (
    !ema9Above21 && !ema21Above50 && !priceAboveEMA50 &&
    macd < macdSignal && histogram < 0 &&
    stoch.k > 20 && stoch.k < 80 && rsi > 30 && rsi < 60 &&
    adx > 55
  ) {
    tradeType = "SHORT";
    confidence = 75;
  }
  // STRONG SHORT: Multiple indicators agree downtrend
  else if (
    !ema9Above21 && !ema21Above50 &&
    macd < macdSignal && histogram < 0 &&
    rsi > 30 && rsi < 60 &&
    adx > 50
  ) {
    tradeType = "SHORT";
    confidence = 70;
  }
  // MODERATE SHORT: Trend confirmation
  else if (!ema9Above21 && macd < macdSignal && rsi > 35 && rsi < 55) {
    tradeType = "SHORT";
    confidence = 62;
  }

  // === TREND CONTINUATION ===
  else if (ema9Above21 && ema21Above50) {
    // Uptrend intact
    tradeType = "LONG";
    confidence = 57;
  }
  else if (!ema9Above21 && !ema21Above50) {
    // Downtrend intact
    tradeType = "SHORT";
    confidence = 57;
  }
  else {
    // Transition - use RSI
    tradeType = rsi > 50 ? "SHORT" : "LONG";
    confidence = 55;
  }

  return { 
    confidence: Math.max(55, Math.min(80, confidence)), 
    tradeType 
  };
}
