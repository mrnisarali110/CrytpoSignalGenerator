// Backtesting module to simulate strategy performance with 100 trades

export interface BacktestMetrics {
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  initialBalance: number;
  finalBalance: number;
  totalProfit: number;
  profitPercentage: number;
  profitFactor: number;
  maxDrawdown: number;
  avgWinPercentage: number;
  avgLossPercentage: number;
}

export function simulateStrategyBacktest(
  strategyWinRate: number,
  strategyLeverage: number,
  riskPerTrade: number = 2.0
): BacktestMetrics {
  const initialBalance = 100;
  const numTrades = 100;
  const tradeAmount = (initialBalance * (riskPerTrade / 100)) * strategyLeverage;

  let balance = initialBalance;
  let maxBalance = initialBalance;
  let maxDrawdown = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalWinProfit = 0;
  let totalLossAmount = 0;

  // Simulate 100 trades based on strategy win rate
  for (let i = 0; i < numTrades; i++) {
    const isWin = Math.random() * 100 < strategyWinRate;

    if (isWin) {
      winningTrades++;
      // Winning trade: make 0.5% to 2% per trade (more with leverage)
      const profitPercentage = (0.5 + Math.random() * 1.5) * (strategyLeverage / 10);
      const tradeProfit = tradeAmount * (profitPercentage / 100);
      balance += tradeProfit;
      totalWinProfit += profitPercentage;
    } else {
      losingTrades++;
      // Losing trade: lose 0.3% to 1% per trade (more with leverage)
      const lossPercentage = (0.3 + Math.random() * 0.7) * (strategyLeverage / 10);
      const tradeLoss = tradeAmount * (lossPercentage / 100);
      balance -= tradeLoss;
      totalLossAmount += lossPercentage;
    }

    // Track max drawdown
    if (balance > maxBalance) {
      maxBalance = balance;
    }
    const drawdown = ((maxBalance - balance) / maxBalance) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const totalProfit = balance - initialBalance;
  const profitPercentage = (totalProfit / initialBalance) * 100;
  const avgWinPercentage = winningTrades > 0 ? totalWinProfit / winningTrades : 0;
  const avgLossPercentage = losingTrades > 0 ? totalLossAmount / losingTrades : 0;
  const profitFactor =
    avgLossPercentage > 0 ? ((avgWinPercentage * winningTrades) / (avgLossPercentage * losingTrades)).toFixed(2) : "0";

  return {
    winRate: strategyWinRate,
    totalTrades: numTrades,
    winningTrades,
    losingTrades,
    initialBalance,
    finalBalance: parseFloat(balance.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    profitPercentage: parseFloat(profitPercentage.toFixed(2)),
    profitFactor: parseFloat(profitFactor as string),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    avgWinPercentage: parseFloat(avgWinPercentage.toFixed(2)),
    avgLossPercentage: parseFloat(avgLossPercentage.toFixed(2)),
  };
}
