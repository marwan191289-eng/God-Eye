import crypto from 'crypto';

interface ChartData {
  id: string;
  symbol: string;
  timeframe: string;
  candles: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  indicators: {
    sma?: Array<{ time: number; value: number }>;
    ema?: Array<{ time: number; value: number }>;
    rsi?: Array<{ time: number; value: number }>;
    macd?: Array<{ time: number; macd: number; signal: number; histogram: number }>;
    bollingerBands?: Array<{ time: number; upper: number; middle: number; lower: number }>;
    atr?: Array<{ time: number; value: number }>;
  };
  supportResistance: {
    support: number[];
    resistance: number[];
  };
  patterns: string[];
  trend: 'uptrend' | 'downtrend' | 'sideways';
}

interface Heatmap {
  id: string;
  timestamp: number;
  data: Array<{
    symbol: string;
    priceChange: number;
    volumeChange: number;
    marketCap: number;
    color: string; // green, red, yellow
  }>;
}

interface LiquidationHeatmap {
  id: string;
  symbol: string;
  timestamp: number;
  levels: Array<{
    price: number;
    longLiquidations: number;
    shortLiquidations: number;
    totalLiquidations: number;
    color: string; // intensity based on volume
  }>;
}

interface DepthChart {
  id: string;
  symbol: string;
  timestamp: number;
  bids: Array<{ price: number; cumulativeVolume: number }>;
  asks: Array<{ price: number; cumulativeVolume: number }>;
  spreadPercentage: number;
}

interface VolumeProfile {
  id: string;
  symbol: string;
  timestamp: number;
  levels: Array<{
    price: number;
    volume: number;
    percentage: number;
    color: string;
  }>;
  pointOfControl: number;
  valueArea: { high: number; low: number };
}

interface TrendAnalysis {
  symbol: string;
  timeframe: string;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  trendlineStart: { time: number; price: number };
  trendlineEnd: { time: number; price: number };
  breakoutLikelihood: number; // 0 to 100
  nextResistance: number;
  nextSupport: number;
}

interface CandleAnalysis {
  pattern: string;
  reliability: number; // 0 to 100
  bullish: boolean;
  description: string;
  nextPriceTarget?: number;
  stopLoss?: number;
}

/**
 * Charting Service
 * Handles advanced charting, visualizations, and technical analysis
 */
export class ChartingService {
  /**
   * Generate Chart Data
   */
  static generateChartData(
    symbol: string,
    timeframe: string,
    candles: Array<{
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>,
    indicators: any,
    supportResistance: any,
    patterns: string[],
    trend: string
  ): ChartData {
    return {
      id: crypto.randomUUID(),
      symbol,
      timeframe,
      candles,
      indicators,
      supportResistance,
      patterns,
      trend: trend as 'uptrend' | 'downtrend' | 'sideways',
    };
  }

  /**
   * Generate Heatmap
   */
  static generateHeatmap(symbols: string[], priceChanges: number[]): Heatmap {
    const data = symbols.map((symbol, index) => {
      const priceChange = priceChanges[index] || 0;
      let color = 'yellow';

      if (priceChange > 5) {
        color = 'green';
      } else if (priceChange < -5) {
        color = 'red';
      }

      return {
        symbol,
        priceChange,
        volumeChange: Math.random() * 100 - 50,
        marketCap: Math.random() * 1000000000,
        color,
      };
    });

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      data,
    };
  }

  /**
   * Generate Liquidation Heatmap
   */
  static generateLiquidationHeatmap(
    symbol: string,
    liquidations: Array<{
      price: number;
      side: 'long' | 'short';
      volume: number;
    }>
  ): LiquidationHeatmap {
    const priceMap = new Map<number, { long: number; short: number }>();

    // Group liquidations by price level
    for (const liq of liquidations) {
      const existing = priceMap.get(liq.price) || { long: 0, short: 0 };
      if (liq.side === 'long') {
        existing.long += liq.volume;
      } else {
        existing.short += liq.volume;
      }
      priceMap.set(liq.price, existing);
    }

    // Find max liquidation volume for color scaling
    let maxVolume = 0;
    for (const { long, short } of priceMap.values()) {
      maxVolume = Math.max(maxVolume, long + short);
    }

    // Generate levels
    const levels = Array.from(priceMap.entries())
      .map(([price, { long, short }]) => {
        const total = long + short;
        const intensity = maxVolume > 0 ? total / maxVolume : 0;

        let color = 'yellow';
        if (intensity > 0.7) {
          color = 'red';
        } else if (intensity > 0.4) {
          color = 'orange';
        }

        return {
          price,
          longLiquidations: long,
          shortLiquidations: short,
          totalLiquidations: total,
          color,
        };
      })
      .sort((a, b) => a.price - b.price);

    return {
      id: crypto.randomUUID(),
      symbol,
      timestamp: Date.now(),
      levels,
    };
  }

  /**
   * Generate Depth Chart
   */
  static generateDepthChart(
    symbol: string,
    bids: Array<[number, number]>,
    asks: Array<[number, number]>
  ): DepthChart {
    // Calculate cumulative volumes
    const bidsCumulative = bids.map((bid, index) => {
      const cumulativeVolume = bids.slice(0, index + 1).reduce((sum, [, vol]) => sum + vol, 0);
      return { price: bid[0], cumulativeVolume };
    });

    const asksCumulative = asks.map((ask, index) => {
      const cumulativeVolume = asks.slice(0, index + 1).reduce((sum, [, vol]) => sum + vol, 0);
      return { price: ask[0], cumulativeVolume };
    });

    // Calculate spread
    const bestBid = bids[0]?.[0] || 0;
    const bestAsk = asks[0]?.[0] || 0;
    const spreadPercentage = bestAsk > 0 ? ((bestAsk - bestBid) / bestAsk) * 100 : 0;

    return {
      id: crypto.randomUUID(),
      symbol,
      timestamp: Date.now(),
      bids: bidsCumulative,
      asks: asksCumulative,
      spreadPercentage,
    };
  }

  /**
   * Generate Volume Profile
   */
  static generateVolumeProfile(
    symbol: string,
    candles: Array<{
      close: number;
      volume: number;
    }>
  ): VolumeProfile {
    const priceMap = new Map<number, number>();
    let totalVolume = 0;

    // Group volume by price level
    for (const candle of candles) {
      const price = Math.round(candle.close / 100) * 100; // Round to nearest 100
      const existing = priceMap.get(price) || 0;
      priceMap.set(price, existing + candle.volume);
      totalVolume += candle.volume;
    }

    // Find point of control (highest volume price)
    let pointOfControl = 0;
    let maxVolume = 0;
    for (const [price, volume] of priceMap.entries()) {
      if (volume > maxVolume) {
        maxVolume = volume;
        pointOfControl = price;
      }
    }

    // Calculate value area (70% of volume)
    const valueAreaVolume = totalVolume * 0.7;
    const sortedPrices = Array.from(priceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.ceil(priceMap.size * 0.3));

    const valueAreaPrices = sortedPrices.map(([price]) => price).sort((a, b) => a - b);
    const valueAreaHigh = Math.max(...valueAreaPrices);
    const valueAreaLow = Math.min(...valueAreaPrices);

    // Generate levels
    const levels = Array.from(priceMap.entries())
      .map(([price, volume]) => {
        const percentage = (volume / totalVolume) * 100;
        const color = price === pointOfControl ? 'red' : percentage > 5 ? 'orange' : 'yellow';

        return {
          price,
          volume,
          percentage,
          color,
        };
      })
      .sort((a, b) => a.price - b.price);

    return {
      id: crypto.randomUUID(),
      symbol,
      timestamp: Date.now(),
      levels,
      pointOfControl,
      valueArea: { high: valueAreaHigh, low: valueAreaLow },
    };
  }

  /**
   * Analyze Trend
   */
  static analyzeTrend(
    symbol: string,
    timeframe: string,
    candles: Array<{
      time: number;
      close: number;
      high: number;
      low: number;
    }>
  ): TrendAnalysis {
    if (candles.length < 5) {
      return {
        symbol,
        timeframe,
        trend: 'sideways',
        strength: 'weak',
        trendlineStart: { time: 0, price: 0 },
        trendlineEnd: { time: 0, price: 0 },
        breakoutLikelihood: 0,
        nextResistance: 0,
        nextSupport: 0,
      };
    }

    // Determine trend
    const closes = candles.map((c) => c.close);
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
    const recentAvg = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;

    let trend: 'uptrend' | 'downtrend' | 'sideways';
    if (recentAvg > avgPrice * 1.02) {
      trend = 'uptrend';
    } else if (recentAvg < avgPrice * 0.98) {
      trend = 'downtrend';
    } else {
      trend = 'sideways';
    }

    // Determine strength
    const volatility = Math.max(...closes) - Math.min(...closes);
    const volatilityPercent = (volatility / avgPrice) * 100;

    let strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
    if (volatilityPercent > 10) {
      strength = 'very_strong';
    } else if (volatilityPercent > 5) {
      strength = 'strong';
    } else if (volatilityPercent > 2) {
      strength = 'moderate';
    } else {
      strength = 'weak';
    }

    // Calculate trendline
    const firstCandle = candles[0];
    const lastCandle = candles[candles.length - 1];

    // Calculate next resistance and support
    const highestHigh = Math.max(...candles.map((c) => c.high));
    const lowestLow = Math.min(...candles.map((c) => c.low));

    return {
      symbol,
      timeframe,
      trend,
      strength,
      trendlineStart: { time: firstCandle.time, price: firstCandle.close },
      trendlineEnd: { time: lastCandle.time, price: lastCandle.close },
      breakoutLikelihood: Math.random() * 100,
      nextResistance: highestHigh * 1.02,
      nextSupport: lowestLow * 0.98,
    };
  }

  /**
   * Analyze Candle Pattern
   */
  static analyzeCandlePattern(
    candles: Array<{
      open: number;
      high: number;
      low: number;
      close: number;
    }>
  ): CandleAnalysis | null {
    if (candles.length < 2) {
      return null;
    }

    const current = candles[candles.length - 1];
    const previous = candles[candles.length - 2];

    // Hammer pattern
    if (
      current.close > current.open &&
      current.low < current.open - (current.high - current.close) * 2
    ) {
      return {
        pattern: 'Hammer',
        reliability: 75,
        bullish: true,
        description: 'Potential reversal pattern indicating bullish pressure',
        nextPriceTarget: current.close * 1.05,
        stopLoss: current.low * 0.99,
      };
    }

    // Shooting star pattern
    if (
      current.close < current.open &&
      current.high > current.open + (current.open - current.close) * 2
    ) {
      return {
        pattern: 'Shooting Star',
        reliability: 75,
        bullish: false,
        description: 'Potential reversal pattern indicating bearish pressure',
        nextPriceTarget: current.close * 0.95,
        stopLoss: current.high * 1.01,
      };
    }

    // Engulfing pattern
    if (
      current.open < previous.close &&
      current.close > previous.open &&
      current.close > previous.close
    ) {
      return {
        pattern: 'Bullish Engulfing',
        reliability: 80,
        bullish: true,
        description: 'Strong bullish reversal pattern',
        nextPriceTarget: current.close * 1.03,
        stopLoss: current.low * 0.99,
      };
    }

    if (
      current.open > previous.close &&
      current.close < previous.open &&
      current.close < previous.close
    ) {
      return {
        pattern: 'Bearish Engulfing',
        reliability: 80,
        bullish: false,
        description: 'Strong bearish reversal pattern',
        nextPriceTarget: current.close * 0.97,
        stopLoss: current.high * 1.01,
      };
    }

    return null;
  }

  /**
   * Generate Trading Signal from Chart
   */
  static generateTradingSignal(
    trendAnalysis: TrendAnalysis,
    candlePattern: CandleAnalysis | null,
    indicators: any
  ): {
    signal: 'buy' | 'sell' | 'hold';
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let buySignals = 0;
    let sellSignals = 0;

    // Trend analysis
    if (trendAnalysis.trend === 'uptrend') {
      buySignals++;
      reasons.push(`Uptrend detected (${trendAnalysis.strength})`);
    } else if (trendAnalysis.trend === 'downtrend') {
      sellSignals++;
      reasons.push(`Downtrend detected (${trendAnalysis.strength})`);
    }

    // Candle pattern
    if (candlePattern) {
      if (candlePattern.bullish) {
        buySignals++;
        reasons.push(`${candlePattern.pattern} pattern detected`);
      } else {
        sellSignals++;
        reasons.push(`${candlePattern.pattern} pattern detected`);
      }
    }

    // Indicators
    if (indicators.rsi) {
      if (indicators.rsi < 30) {
        buySignals++;
        reasons.push('RSI oversold');
      } else if (indicators.rsi > 70) {
        sellSignals++;
        reasons.push('RSI overbought');
      }
    }

    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    if (buySignals > sellSignals) {
      signal = 'buy';
    } else if (sellSignals > buySignals) {
      signal = 'sell';
    }

    const totalSignals = buySignals + sellSignals;
    const confidence = totalSignals > 0 ? (Math.max(buySignals, sellSignals) / totalSignals) * 100 : 0;

    return {
      signal,
      confidence: Math.min(100, confidence),
      reasons,
    };
  }

  /**
   * Calculate Fibonacci Levels
   */
  static calculateFibonacciLevels(
    high: number,
    low: number
  ): {
    level0: number;
    level236: number;
    level382: number;
    level50: number;
    level618: number;
    level786: number;
    level100: number;
  } {
    const diff = high - low;

    return {
      level0: low,
      level236: low + diff * 0.236,
      level382: low + diff * 0.382,
      level50: low + diff * 0.5,
      level618: low + diff * 0.618,
      level786: low + diff * 0.786,
      level100: high,
    };
  }

  /**
   * Calculate Pivot Points
   */
  static calculatePivotPoints(
    high: number,
    low: number,
    close: number
  ): {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  } {
    const pivot = (high + low + close) / 3;
    const range = high - low;

    return {
      pivot,
      r1: pivot + range * 0.382,
      r2: pivot + range * 0.618,
      r3: pivot + range,
      s1: pivot - range * 0.382,
      s2: pivot - range * 0.618,
      s3: pivot - range,
    };
  }
}

export default ChartingService;
