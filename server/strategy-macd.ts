// MACD + RSI Strategy - INVERTED for 2024 Crypto Markets
// Market behavior shows inverse signals work better (contrarian approach)

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

function calculateBollingerBands(prices: number[], period: number = 20): { upper: number; middle: number; lower: number } {
  const recentPrices = prices.slice(-period);
  const middle = recentPrices.reduce((a, b) => a + b, 0) / period;
  
  const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: middle + (stdDev * 2),
    middle,
    lower: middle - (stdDev * 2)
  };
}

export function analyzeSignal(prices: number[]): StrategyResults {
  if (prices.length < 30) {
    return { confidence: 55, tradeType: "LONG" };
  }

  const rsi = calculateRSI(prices);
  const { macd, signal, histogram } = calculateMACD(prices);
  const bollingerBands = calculateBollingerBands(prices);
  const currentPrice = prices[prices.length - 1];

  let confidence = 0;
  let tradeType: "LONG" | "SHORT" = "LONG";

  // INVERTED LOGIC: In 2024 crypto, contrarian signals work better
  // When MACD looks bullish -> market is overheated -> go SHORT
  // When MACD looks bearish -> market is oversold -> go LONG
  
  const macdBullish = macd > signal && histogram > 0;
  const macdBearish = macd < signal && histogram < 0;

  const priceNearLower = currentPrice <= bollingerBands.lower * 1.05;
  const priceNearUpper = currentPrice >= bollingerBands.upper * 0.95;

  // INVERTED: Strong Bearish MACD = Go LONG (contrarian)
  if (macdBearish && priceNearLower && rsi > 40) {
    tradeType = "LONG";
    confidence = 76;
  }
  // INVERTED: Moderate Bearish MACD = Go LONG
  else if (macdBearish && rsi > 35 && rsi < 65) {
    tradeType = "LONG";
    confidence = 70;
  }
  // INVERTED: RSI oversold = Go LONG
  else if (rsi < 30) {
    tradeType = "LONG";
    confidence = 66;
  }
  
  // INVERTED: Strong Bullish MACD = Go SHORT (contrarian)
  else if (macdBullish && priceNearUpper && rsi < 60) {
    tradeType = "SHORT";
    confidence = 76;
  }
  // INVERTED: Moderate Bullish MACD = Go SHORT
  else if (macdBullish && rsi > 35 && rsi < 65) {
    tradeType = "SHORT";
    confidence = 70;
  }
  // INVERTED: RSI overbought = Go SHORT
  else if (rsi > 70) {
    tradeType = "SHORT";
    confidence = 66;
  }
  
  else if (rsi > 50) {
    // Default: If RSI is elevated but not overbought, lean SHORT
    tradeType = "SHORT";
    confidence = 55;
  }
  else if (rsi < 50) {
    // Default: If RSI is depressed but not oversold, lean LONG
    tradeType = "LONG";
    confidence = 55;
  }
  else {
    // Perfect middle - alternate based on price position
    tradeType = currentPrice > bollingerBands.middle ? "SHORT" : "LONG";
    confidence = 55;
  }

  return { confidence: Math.max(55, Math.min(80, confidence)), tradeType };
}
