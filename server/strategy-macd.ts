// Micro-Scalp v2: MACD + Bollinger Bands + RSI Strategy
// Detects momentum shifts and trend changes with confirmed signals

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
  const ema9 = calculateEMA(prices, 9);
  const ema21 = calculateEMA(prices, 21);

  let confidence = 0;
  let tradeType: "LONG" | "SHORT" = "LONG";

  const macdBullish = macd > signal && histogram > 0;
  const macdBearish = macd < signal && histogram < 0;
  const priceAboveEMA9 = currentPrice > ema9;
  const ema9AboveEMA21 = ema9 > ema21;

  // === LONG SIGNALS - Bullish Trend ===
  // Strong: MACD bullish + Price above EMAs + RSI not overbought
  if (macdBullish && priceAboveEMA9 && ema9AboveEMA21 && rsi < 70) {
    tradeType = "LONG";
    confidence = 74;
  }
  // Moderate: Price near lower BB + MACD bullish + RSI oversold recovery
  else if (currentPrice <= bollingerBands.lower * 1.02 && macdBullish && rsi > 35 && rsi < 55) {
    tradeType = "LONG";
    confidence = 68;
  }
  // Weak: MACD just crossed bullish
  else if (macdBullish && histogram > 0 && histogram < 0.5 * Math.abs(macd)) {
    tradeType = "LONG";
    confidence = 60;
  }

  // === SHORT SIGNALS - Bearish Trend ===
  // Strong: MACD bearish + Price below EMAs + RSI not oversold
  else if (macdBearish && !priceAboveEMA9 && !ema9AboveEMA21 && rsi > 30) {
    tradeType = "SHORT";
    confidence = 74;
  }
  // Moderate: Price near upper BB + MACD bearish + RSI overbought recovery
  else if (currentPrice >= bollingerBands.upper * 0.98 && macdBearish && rsi > 45 && rsi < 65) {
    tradeType = "SHORT";
    confidence = 68;
  }
  // Weak: MACD just crossed bearish
  else if (macdBearish && histogram < 0 && Math.abs(histogram) < 0.5 * Math.abs(macd)) {
    tradeType = "SHORT";
    confidence = 60;
  }

  // === TREND CONTINUATION - No clear reversal ===
  else if (priceAboveEMA9 && ema9AboveEMA21) {
    // Still in uptrend
    tradeType = "LONG";
    confidence = 57;
  }
  else if (!priceAboveEMA9 && !ema9AboveEMA21) {
    // Still in downtrend
    tradeType = "SHORT";
    confidence = 57;
  }
  else {
    // Uncertain - use RSI extremes
    tradeType = rsi > 50 ? "SHORT" : "LONG";
    confidence = 55;
  }

  return { confidence: Math.max(55, Math.min(80, confidence)), tradeType };
}
