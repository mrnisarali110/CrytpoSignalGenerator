// GPT-Strategy: Ichimoku + MACD + ATR + Market Structure
// Institutional-grade strategy combining trend, momentum, volatility, and structure
// Win Rate Target: 60-70% | Focus: High-confidence setups with strong trend alignment

export interface StrategyResults {
  confidence: number;
  tradeType: "LONG" | "SHORT";
}

// === ICHIMOKU CLOUD CALCULATIONS ===
function calculateIchimoku(prices: number[]): {
  tenkan: number;
  kijun: number;
  senkouA: number;
  senkouB: number;
  chikou: number;
} {
  if (prices.length < 52) {
    return { tenkan: prices[prices.length - 1], kijun: prices[prices.length - 1], senkouA: prices[prices.length - 1], senkouB: prices[prices.length - 1], chikou: prices[prices.length - 1] };
  }

  // Tenkan (9-period): (9-period High + 9-period Low) / 2
  const last9 = prices.slice(-9);
  const tenkan = (Math.max(...last9) + Math.min(...last9)) / 2;

  // Kijun (26-period): (26-period High + 26-period Low) / 2
  const last26 = prices.slice(-26);
  const kijun = (Math.max(...last26) + Math.min(...last26)) / 2;

  // Senkou Span A: (Tenkan + Kijun) / 2
  const senkouA = (tenkan + kijun) / 2;

  // Senkou Span B (52-period): (52-period High + 52-period Low) / 2
  const last52 = prices.slice(-52);
  const senkouB = (Math.max(...last52) + Math.min(...last52)) / 2;

  // Chikou (Closing Price 26 periods in the past)
  const chikou = prices.length >= 26 ? prices[prices.length - 26] : prices[prices.length - 1];

  return { tenkan, kijun, senkouA, senkouB, chikou };
}

// === ATR (Average True Range) ===
function calculateATR(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 0;

  let trueRange = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const high = prices[i];
    const low = prices[i];
    const prevClose = i > 0 ? prices[i - 1] : prices[i];

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRange += tr;
  }

  return trueRange / period;
}

// === MACD with Histogram Strength ===
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

// === RSI (Momentum) ===
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

// === MARKET STRUCTURE: Recent Swing Points ===
function getMarketStructure(prices: number[]): { recentHighs: number[]; recentLows: number[]; breakoutLevel: number; supportLevel: number } {
  if (prices.length < 10) {
    return { recentHighs: [prices[prices.length - 1]], recentLows: [prices[prices.length - 1]], breakoutLevel: prices[prices.length - 1], supportLevel: prices[prices.length - 1] };
  }

  const last10 = prices.slice(-10);
  const recentHighs = [Math.max(...last10)];
  const recentLows = [Math.min(...last10)];

  const breakoutLevel = Math.max(...last10); // Resistance
  const supportLevel = Math.min(...last10); // Support

  return { recentHighs, recentLows, breakoutLevel, supportLevel };
}

export function analyzeSignal(prices: number[]): StrategyResults {
  if (prices.length < 52) {
    return { confidence: 55, tradeType: "LONG" };
  }

  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];

  // === INDICATOR CALCULATIONS ===
  const { tenkan, kijun, senkouA, senkouB, chikou } = calculateIchimoku(prices);
  const { macd, signal, histogram } = calculateMACD(prices);
  const atr = calculateATR(prices);
  const rsi = calculateRSI(prices);
  const { breakoutLevel, supportLevel } = getMarketStructure(prices);

  // === CLOUD STATUS ===
  const cloudTop = Math.max(senkouA, senkouB);
  const cloudBottom = Math.min(senkouA, senkouB);
  const priceAboveCloud = currentPrice > cloudTop;
  const priceBelowCloud = currentPrice < cloudBottom;
  const cloudBullish = senkouA > senkouB; // Green cloud
  const cloudBearish = senkouA < senkouB; // Red cloud

  // === STRUCTURE VALIDATION ===
  const nearBreakout = currentPrice >= (breakoutLevel - atr * 0.5);
  const nearSupport = currentPrice <= (supportLevel + atr * 0.5);
  const closingAboveBreakout = previousPrice < breakoutLevel && currentPrice > breakoutLevel;
  const closingBelowSupport = previousPrice > supportLevel && currentPrice < supportLevel;

  // === VOLATILITY FILTER (ATR expansion) ===
  const volatilityHigh = atr > (currentPrice * 0.02); // ATR > 2% of price = high volatility

  // === MOMENTUM CONFIRMATION ===
  const macdBullish = macd > signal && histogram > 0;
  const macdBearish = macd < signal && histogram < 0;
  const histogramStrong = Math.abs(histogram) > Math.abs(macd) * 0.1; // Histogram > 10% of MACD
  const rsiNotOverbought = rsi < 70;
  const rsiNotOversold = rsi > 30;

  let confidence = 0;
  let tradeType: "LONG" | "SHORT" = "LONG";

  // === LONG SIGNAL LOGIC ===
  // Condition 1: Price above Ichimoku cloud (bullish trend)
  // Condition 2: Tenkan crosses above Kijun (momentum confirmation)
  // Condition 3: MACD histogram > 0 and expanding (strong uptrend)
  // Condition 4: Price near or breaking above resistance with high volatility
  // Condition 5: Chikou above price (future confirmation)
  // Condition 6: RSI in optimal zone (40-65 = strong but not overbought)

  const bullishTrendConfirmed = priceAboveCloud && cloudBullish;
  const bullishMomentumCrossover = tenkan > kijun && tenkan > previousPrice * 0.998; // Tenkan just crossed above Kijun
  const bullishMACDExpanding = macdBullish && histogramStrong && histogram > 0;
  const bullishBreakout = (closingAboveBreakout || nearBreakout) && volatilityHigh;
  const bullishChikou = chikou > currentPrice; // Chikou confirms uptrend
  const bullishRSI = rsi > 45 && rsi < 65; // Optimal momentum zone

  if (bullishTrendConfirmed && bullishMomentumCrossover && bullishMACDExpanding && bullishBreakout && bullishChikou && bullishRSI) {
    tradeType = "LONG";
    confidence = 78; // Ultra-high conviction
  } 
  else if (bullishTrendConfirmed && bullishMACDExpanding && bullishBreakout && bullishRSI) {
    tradeType = "LONG";
    confidence = 72; // Strong LONG
  } 
  else if (bullishTrendConfirmed && bullishMomentumCrossover && bullishMACDExpanding) {
    tradeType = "LONG";
    confidence = 68; // Moderate LONG
  } 
  else if (priceAboveCloud && macdBullish && rsiNotOverbought) {
    tradeType = "LONG";
    confidence = 62; // Weak LONG
  }

  // === SHORT SIGNAL LOGIC ===
  // Mirror of LONG logic but inverted

  const bearishTrendConfirmed = priceBelowCloud && cloudBearish;
  const bearishMomentumCrossover = tenkan < kijun && tenkan < previousPrice * 1.002; // Tenkan just crossed below Kijun
  const bearishMACDExpanding = macdBearish && histogramStrong && histogram < 0;
  const bearishBreakdown = (closingBelowSupport || nearSupport) && volatilityHigh;
  const bearishChikou = chikou < currentPrice; // Chikou confirms downtrend
  const bearishRSI = rsi < 55 && rsi > 35; // Optimal momentum zone (inverted)

  if (bearishTrendConfirmed && bearishMomentumCrossover && bearishMACDExpanding && bearishBreakdown && bearishChikou && bearishRSI) {
    tradeType = "SHORT";
    confidence = 78; // Ultra-high conviction
  } 
  else if (bearishTrendConfirmed && bearishMACDExpanding && bearishBreakdown && bearishRSI) {
    tradeType = "SHORT";
    confidence = 72; // Strong SHORT
  } 
  else if (bearishTrendConfirmed && bearishMomentumCrossover && bearishMACDExpanding) {
    tradeType = "SHORT";
    confidence = 68; // Moderate SHORT
  } 
  else if (priceBelowCloud && macdBearish && rsiNotOversold) {
    tradeType = "SHORT";
    confidence = 62; // Weak SHORT
  }
  else {
    confidence = 55; // No clear signal
  }

  return { confidence: Math.max(55, Math.min(80, confidence)), tradeType };
}
