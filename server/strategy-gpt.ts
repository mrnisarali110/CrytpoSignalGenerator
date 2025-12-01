// GPT-Strategy: EMA Trend + MACD Momentum Confirmation
// Identifies primary trend with momentum confirmation for high-accuracy signals

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

export function analyzeSignal(prices: number[]): StrategyResults {
  if (prices.length < 30) {
    return { confidence: 55, tradeType: "LONG" };
  }

  const currentPrice = prices[prices.length - 1];
  const { macd, signal, histogram } = calculateMACD(prices);
  const rsi = calculateRSI(prices);
  
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  const ema200 = calculateEMA(prices, 200);

  let confidence = 0;
  let tradeType: "LONG" | "SHORT" = "LONG";

  const priceAboveEMA20 = currentPrice > ema20;
  const ema20AboveEMA50 = ema20 > ema50;
  const ema50AboveEMA200 = ema50 > ema200;
  
  const macdBullish = macd > signal && histogram > 0;
  const macdBearish = macd < signal && histogram < 0;

  // === STRONG LONG: All trends aligned, MACD confirms ===
  if (priceAboveEMA20 && ema20AboveEMA50 && ema50AboveEMA200 && macdBullish && rsi < 70) {
    tradeType = "LONG";
    confidence = 76;
  }
  // MODERATE LONG: Primary trend up, MACD confirms
  else if (priceAboveEMA20 && ema20AboveEMA50 && macdBullish && rsi < 65) {
    tradeType = "LONG";
    confidence = 70;
  }
  // WEAK LONG: Just price above EMA or just MACD bullish
  else if (priceAboveEMA20 && macdBullish && rsi > 35 && rsi < 70) {
    tradeType = "LONG";
    confidence = 62;
  }

  // === STRONG SHORT: All trends aligned, MACD confirms ===
  else if (!priceAboveEMA20 && !ema20AboveEMA50 && !ema50AboveEMA200 && macdBearish && rsi > 30) {
    tradeType = "SHORT";
    confidence = 76;
  }
  // MODERATE SHORT: Primary trend down, MACD confirms
  else if (!priceAboveEMA20 && !ema20AboveEMA50 && macdBearish && rsi > 35) {
    tradeType = "SHORT";
    confidence = 70;
  }
  // WEAK SHORT: Just price below EMA or just MACD bearish
  else if (!priceAboveEMA20 && macdBearish && rsi > 30 && rsi < 65) {
    tradeType = "SHORT";
    confidence = 62;
  }

  // === TREND CONTINUATION - No new signal but trend intact ===
  else if (priceAboveEMA20 && ema20AboveEMA50) {
    // Uptrend intact
    tradeType = "LONG";
    confidence = 58;
  }
  else if (!priceAboveEMA20 && !ema20AboveEMA50) {
    // Downtrend intact
    tradeType = "SHORT";
    confidence = 58;
  }
  else {
    // Transition zone - use price position
    tradeType = currentPrice > ema50 ? "LONG" : "SHORT";
    confidence = 55;
  }

  return { confidence: Math.max(55, Math.min(80, confidence)), tradeType };
}
