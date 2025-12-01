// MACD + Bollinger Bands + RSI Strategy - OPTIMIZED for Sentiment AI
// Increased selectivity for higher win rate accuracy

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
  
  // Signal line is 9-period EMA of MACD
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

// Calculate trend strength - measure how strong the price move is
function calculateTrendStrength(prices: number[]): number {
  if (prices.length < 10) return 50;
  const recent = prices.slice(-10);
  const highest = Math.max(...recent);
  const lowest = Math.min(...recent);
  const range = highest - lowest;
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  return Math.min(100, Math.max(0, (range / avg) * 100));
}

export function analyzeSignal(prices: number[]): StrategyResults {
  if (prices.length < 30) {
    return { confidence: 55, tradeType: "LONG" };
  }

  const rsi = calculateRSI(prices);
  const { macd, signal, histogram } = calculateMACD(prices);
  const bollingerBands = calculateBollingerBands(prices);
  const currentPrice = prices[prices.length - 1];
  const trendStrength = calculateTrendStrength(prices);

  let confidence = 0;
  let tradeType: "LONG" | "SHORT" = "LONG";

  // MACD Bullish: MACD > Signal and positive histogram
  const macdBullish = macd > signal && histogram > 0;
  // MACD Bearish: MACD < Signal and negative histogram
  const macdBearish = macd < signal && histogram < 0;
  
  // Histogram strength check (stronger signals)
  const histogramStrength = Math.abs(histogram) > 0.01;

  // Bollinger Bands: Price near bands
  const priceNearLower = currentPrice <= bollingerBands.lower * 1.05;
  const priceNearUpper = currentPrice >= bollingerBands.upper * 0.95;

  // OPTIMIZED CONDITIONS - More selective to reduce false signals
  
  // STRONG BUY: All signals aligned + TIGHT RSI
  if (macdBullish && histogramStrength && priceNearLower && rsi < 45 && trendStrength > 40) {
    tradeType = "LONG";
    confidence = 78;
  } 
  // BUY: MACD bullish + moderate RSI
  else if (macdBullish && histogramStrength && rsi < 40) {
    tradeType = "LONG";
    confidence = 74;
  }
  // BUY: Price at lower band + strong uptrend
  else if (priceNearLower && macdBullish && rsi < 50) {
    tradeType = "LONG";
    confidence = 70;
  }
  // STRONG SELL: All signals aligned + TIGHT RSI
  else if (macdBearish && histogramStrength && priceNearUpper && rsi > 55 && trendStrength > 40) {
    tradeType = "SHORT";
    confidence = 77;
  }
  // SELL: MACD bearish + moderate RSI
  else if (macdBearish && histogramStrength && rsi > 60) {
    tradeType = "SHORT";
    confidence = 74;
  }
  // SELL: Price at upper band + strong downtrend
  else if (priceNearUpper && macdBearish && rsi > 50) {
    tradeType = "SHORT";
    confidence = 70;
  }
  // Weak signals - only on strong oversold/overbought
  else if (rsi < 25 && macdBullish) {
    tradeType = "LONG";
    confidence = 65;
  }
  else if (rsi > 75 && macdBearish) {
    tradeType = "SHORT";
    confidence = 65;
  }
  else {
    // No clear signal
    confidence = 55;
  }

  return { confidence: Math.max(55, Math.min(80, confidence)), tradeType };
}
