// WIN OR DIE Strategy - INVERTED for 2025 Crypto Markets
// Ultra-Precise High-Leverage with Contrarian Signals
// When market looks bullish → we SHORT (contrarian)
// When market looks bearish → we LONG (contrarian)

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

// Stochastic Oscillator - Momentum and trend reversal
function calculateStochastic(prices: number[], period: number = 14): { k: number; d: number } {
  const recentPrices = prices.slice(-period);
  const highest = Math.max(...recentPrices);
  const lowest = Math.min(...recentPrices);
  const currentPrice = prices[prices.length - 1];
  
  const k = ((currentPrice - lowest) / (highest - lowest)) * 100 || 50;
  const d = Math.max(55, Math.min(45, k));
  
  return { k: Math.max(0, Math.min(100, k)), d };
}

// ADX - Trend strength indicator
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

// Volume strength analysis
function analyzeVolumeTrend(prices: number[]): number {
  if (prices.length < 20) return 50;
  
  const recent = prices.slice(-10);
  const previous = prices.slice(-20, -10);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
  
  const volatility = Math.abs(recent[recent.length - 1] - recent[0]) / recentAvg;
  return Math.min(100, 50 + (volatility * 200));
}

export function analyzeSignal(prices: number[]): StrategyResults {
  if (prices.length < 40) {
    return { confidence: 55, tradeType: "LONG" };
  }

  const rsi = calculateRSI(prices);
  const { macd, signal: macdSignal, histogram } = calculateMACD(prices);
  const stoch = calculateStochastic(prices);
  const adx = calculateADX(prices);
  const volumeTrend = analyzeVolumeTrend(prices);
  
  const ema9 = calculateEMA(prices, 9);
  const ema21 = calculateEMA(prices, 21);
  const ema50 = calculateEMA(prices, 50);
  const currentPrice = prices[prices.length - 1];
  
  const ema9Above21 = ema9 > ema21;
  const ema21Above50 = ema21 > ema50;
  const priceAboveEMA50 = currentPrice > ema50;

  let confidence = 0;
  let tradeType: "LONG" | "SHORT" = "LONG";

  // === INVERTED LOGIC for 2025 Market ===
  // When traditional indicators show STRONG BULLISH → We SHORT (contrarian)
  
  // ULTRA BEARISH SIGNAL (INVERTED: Traditional bullish) = Go SHORT
  if (
    ema9Above21 && ema21Above50 && priceAboveEMA50 &&
    macd > macdSignal && histogram > 0 &&
    stoch.k < 80 && rsi < 75 &&
    adx > 55 &&
    volumeTrend > 60
  ) {
    tradeType = "SHORT";
    confidence = 75;
  }
  // STRONG BEARISH (INVERTED: Traditional bullish) = Go SHORT
  else if (
    ema9Above21 && ema21Above50 &&
    macd > macdSignal &&
    stoch.k < 85 && rsi < 70 &&
    adx > 50
  ) {
    tradeType = "SHORT";
    confidence = 72;
  }
  // === INVERTED: When indicators show STRONG BEARISH → We LONG (contrarian) ===
  // ULTRA BULLISH SIGNAL (INVERTED: Traditional bearish) = Go LONG
  else if (
    !ema9Above21 && !ema21Above50 && currentPrice < ema50 &&
    macd < macdSignal && histogram < 0 &&
    stoch.k > 20 && rsi > 25 &&
    adx > 55 &&
    volumeTrend > 60
  ) {
    tradeType = "LONG";
    confidence = 75;
  }
  // STRONG BULLISH (INVERTED: Traditional bearish) = Go LONG
  else if (
    !ema9Above21 && !ema21Above50 &&
    macd < macdSignal &&
    stoch.k > 15 && rsi > 30 &&
    adx > 50
  ) {
    tradeType = "LONG";
    confidence = 72;
  }
  // MODERATE BEARISH (INVERTED: Traditional bullish) = Go SHORT
  else if (ema9Above21 && macd > macdSignal && stoch.k < 70 && rsi < 65) {
    tradeType = "SHORT";
    confidence = 68;
  }
  // MODERATE BULLISH (INVERTED: Traditional bearish) = Go LONG
  else if (!ema9Above21 && macd < macdSignal && stoch.k > 30 && rsi > 35) {
    tradeType = "LONG";
    confidence = 67;
  }
  // WEAK SIGNALS (INVERTED: RSI extremes)
  else if (rsi > 70) {
    tradeType = "SHORT";
    confidence = 60;
  } 
  else if (rsi < 30) {
    tradeType = "LONG";
    confidence = 60;
  } 
  else {
    tradeType = "LONG";
    confidence = 55;
  }

  return { 
    confidence: Math.max(55, Math.min(80, confidence)), 
    tradeType 
  };
}
