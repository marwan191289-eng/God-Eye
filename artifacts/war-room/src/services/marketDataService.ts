import crypto from 'crypto';

interface Candle {
  symbol: string;
  timeframe: string;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteAssetVolume: number;
}

interface TechnicalIndicators {
  symbol: string;
  timeframe: string;
  timestamp: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  bollingerBandUpper?: number;
  bollingerBandMiddle?: number;
  bollingerBandLower?: number;
  atr?: number;
}

interface OrderBook {
  symbol: string;
  bids: Array<[number, number]>; // [price, quantity]
  asks: Array<[number, number]>;
  timestamp: number;
}

interface LiquidationData {
  symbol: string;
  priceLevel: number;
  liquidationVolume: number;
  side: 'long' | 'short';
  timestamp: number;
}

interface MarketSentiment {
  symbol: string;
  socialSentiment: number; // -1 to 1
  newsSentiment: number; // -1 to 1
  onChainSentiment: number; // -1 to 1
  fearGreedIndex: number; // 0 to 100
  whaleActivityScore: number; // 0 to 100
  overallSentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  timestamp: number;
}

/**
 * Market Data Service
 * Handles real-time market data, technical indicators, and market sentiment
 */
export class MarketDataService {
  /**
   * Fetch Candles (OHLCV)
   */
  static async fetchCandles(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<Candle[]> {
    // In production, this would fetch from exchange API
    const candles: Candle[] = [];
    const now = Date.now();
    const timeframeMs = this.getTimeframeMs(timeframe);

    for (let i = limit - 1; i >= 0; i--) {
      const openTime = now - i * timeframeMs;
      const closeTime = openTime + timeframeMs;

      // Simulate candle data
      const open = 40000 + Math.random() * 5000;
      const close = open + (Math.random() - 0.5) * 2000;
      const high = Math.max(open, close) + Math.random() * 1000;
      const low = Math.min(open, close) - Math.random() * 1000;
      const volume = Math.random() * 1000;

      candles.push({
        symbol,
        timeframe,
        openTime,
        closeTime,
        open,
        high,
        low,
        close,
        volume,
        quoteAssetVolume: volume * close,
      });
    }

    return candles;
  }

  /**
   * Calculate Technical Indicators
   */
  static calculateTechnicalIndicators(candles: Candle[], timeframe: string): TechnicalIndicators {
    if (candles.length === 0) {
      throw new Error('No candles provided');
    }

    const closes = candles.map((c) => c.close);
    const symbol = candles[0].symbol;
    const timestamp = candles[candles.length - 1].closeTime;

    return {
      symbol,
      timeframe,
      timestamp,
      sma20: this.calculateSMA(closes, 20),
      sma50: this.calculateSMA(closes, 50),
      sma200: this.calculateSMA(closes, 200),
      ema12: this.calculateEMA(closes, 12),
      ema26: this.calculateEMA(closes, 26),
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      bollingerBandUpper: this.calculateBollingerBand(closes, 20, 2).upper,
      bollingerBandMiddle: this.calculateBollingerBand(closes, 20, 2).middle,
      bollingerBandLower: this.calculateBollingerBand(closes, 20, 2).lower,
      atr: this.calculateATR(candles, 14),
    };
  }

  /**
   * Calculate SMA (Simple Moving Average)
   */
  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices[prices.length - 1];
    }

    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices[prices.length - 1];
    }

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      return 50;
    }

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) {
      return 100;
    }

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(prices: number[]): number {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBand(
    prices: number[],
    period: number = 20,
    stdDev: number = 2
  ): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(prices, period);

    const variance =
      prices
        .slice(-period)
        .reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;

    const std = Math.sqrt(variance);

    return {
      upper: sma + std * stdDev,
      middle: sma,
      lower: sma - std * stdDev,
    };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  static calculateATR(candles: Candle[], period: number = 14): number {
    if (candles.length < period) {
      return 0;
    }

    let trueRanges = 0;

    for (let i = candles.length - period; i < candles.length; i++) {
      const current = candles[i];
      const previous = i > 0 ? candles[i - 1] : current;

      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);

      const tr = Math.max(tr1, tr2, tr3);
      trueRanges += tr;
    }

    return trueRanges / period;
  }

  /**
   * Fetch Order Book
   */
  static async fetchOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    // In production, this would fetch from exchange API
    const bids: Array<[number, number]> = [];
    const asks: Array<[number, number]> = [];

    const midPrice = 40000;

    // Generate bids (below mid price)
    for (let i = 0; i < limit; i++) {
      const price = midPrice - (i + 1) * 10;
      const quantity = Math.random() * 10;
      bids.push([price, quantity]);
    }

    // Generate asks (above mid price)
    for (let i = 0; i < limit; i++) {
      const price = midPrice + (i + 1) * 10;
      const quantity = Math.random() * 10;
      asks.push([price, quantity]);
    }

    return {
      symbol,
      bids: bids.reverse(),
      asks,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate Order Book Imbalance
   */
  static calculateOrderBookImbalance(orderBook: OrderBook): number {
    const bidVolume = orderBook.bids.reduce((sum, [, qty]) => sum + qty, 0);
    const askVolume = orderBook.asks.reduce((sum, [, qty]) => sum + qty, 0);

    const totalVolume = bidVolume + askVolume;
    if (totalVolume === 0) return 0;

    return (bidVolume - askVolume) / totalVolume;
  }

  /**
   * Fetch Liquidation Map
   */
  static async fetchLiquidationMap(symbol: string): Promise<LiquidationData[]> {
    // In production, this would fetch from exchange API
    const liquidations: LiquidationData[] = [];
    const currentPrice = 40000;

    // Generate liquidation data
    for (let i = 0; i < 50; i++) {
      const isLong = Math.random() > 0.5;
      const priceOffset = (Math.random() - 0.5) * 5000;
      const priceLevel = currentPrice + priceOffset;

      liquidations.push({
        symbol,
        priceLevel,
        liquidationVolume: Math.random() * 100,
        side: isLong ? 'long' : 'short',
        timestamp: Date.now(),
      });
    }

    return liquidations;
  }

  /**
   * Analyze Market Sentiment
   */
  static async analyzeMarketSentiment(symbol: string): Promise<MarketSentiment> {
    // In production, this would integrate with sentiment APIs
    const socialSentiment = (Math.random() - 0.5) * 2; // -1 to 1
    const newsSentiment = (Math.random() - 0.5) * 2;
    const onChainSentiment = (Math.random() - 0.5) * 2;
    const fearGreedIndex = Math.random() * 100;
    const whaleActivityScore = Math.random() * 100;

    // Calculate overall sentiment
    const avgSentiment = (socialSentiment + newsSentiment + onChainSentiment) / 3;
    let overallSentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

    if (avgSentiment < -0.6) {
      overallSentiment = 'very_negative';
    } else if (avgSentiment < -0.2) {
      overallSentiment = 'negative';
    } else if (avgSentiment < 0.2) {
      overallSentiment = 'neutral';
    } else if (avgSentiment < 0.6) {
      overallSentiment = 'positive';
    } else {
      overallSentiment = 'very_positive';
    }

    return {
      symbol,
      socialSentiment,
      newsSentiment,
      onChainSentiment,
      fearGreedIndex,
      whaleActivityScore,
      overallSentiment,
      timestamp: Date.now(),
    };
  }

  /**
   * Detect Support and Resistance Levels
   */
  static detectSupportResistance(
    candles: Candle[]
  ): { support: number[]; resistance: number[] } {
    const support: number[] = [];
    const resistance: number[] = [];

    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);

    // Find local minima (support)
    for (let i = 1; i < lows.length - 1; i++) {
      if (lows[i] < lows[i - 1] && lows[i] < lows[i + 1]) {
        support.push(lows[i]);
      }
    }

    // Find local maxima (resistance)
    for (let i = 1; i < highs.length - 1; i++) {
      if (highs[i] > highs[i - 1] && highs[i] > highs[i + 1]) {
        resistance.push(highs[i]);
      }
    }

    // Sort and remove duplicates
    support = [...new Set(support)].sort((a, b) => a - b);
    resistance = [...new Set(resistance)].sort((a, b) => a - b);

    return { support, resistance };
  }

  /**
   * Detect Trend
   */
  static detectTrend(candles: Candle[]): 'uptrend' | 'downtrend' | 'sideways' {
    if (candles.length < 3) {
      return 'sideways';
    }

    const closes = candles.map((c) => c.close);
    const sma20 = this.calculateSMA(closes, 20);
    const currentPrice = closes[closes.length - 1];

    const uptrend = closes.filter((c) => c > sma20).length / closes.length;

    if (uptrend > 0.65) {
      return 'uptrend';
    } else if (uptrend < 0.35) {
      return 'downtrend';
    } else {
      return 'sideways';
    }
  }

  /**
   * Get Timeframe in Milliseconds
   */
  static getTimeframeMs(timeframe: string): number {
    const timeframes: { [key: string]: number } = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '30m': 1800000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000,
      '1M': 2592000000,
    };

    return timeframes[timeframe] || 60000;
  }

  /**
   * Calculate Volume Profile
   */
  static calculateVolumeProfile(
    candles: Candle[],
    bins: number = 20
  ): Array<{ priceLevel: number; volume: number }> {
    const minPrice = Math.min(...candles.map((c) => c.low));
    const maxPrice = Math.max(...candles.map((c) => c.high));
    const binSize = (maxPrice - minPrice) / bins;

    const profile: { [key: number]: number } = {};

    for (const candle of candles) {
      const binIndex = Math.floor((candle.close - minPrice) / binSize);
      const priceLevel = minPrice + binIndex * binSize;
      profile[priceLevel] = (profile[priceLevel] || 0) + candle.volume;
    }

    return Object.entries(profile)
      .map(([priceLevel, volume]) => ({
        priceLevel: parseFloat(priceLevel),
        volume,
      }))
      .sort((a, b) => a.priceLevel - b.priceLevel);
  }

  /**
   * Detect Chart Patterns
   */
  static detectChartPatterns(candles: Candle[]): string[] {
    const patterns: string[] = [];

    if (candles.length < 5) {
      return patterns;
    }

    const closes = candles.map((c) => c.close);
    const last5 = closes.slice(-5);

    // Detect double top
    if (last5[0] === last5[2] && last5[1] < last5[0] && last5[3] < last5[2] && last5[4] < last5[3]) {
      patterns.push('double_top');
    }

    // Detect double bottom
    if (last5[0] === last5[2] && last5[1] > last5[0] && last5[3] > last5[2] && last5[4] > last5[3]) {
      patterns.push('double_bottom');
    }

    // Detect head and shoulders
    if (
      last5[0] < last5[1] &&
      last5[1] > last5[2] &&
      last5[2] > last5[3] &&
      last5[3] < last5[4] &&
      last5[1] > last5[4]
    ) {
      patterns.push('head_and_shoulders');
    }

    return patterns;
  }
}

export default MarketDataService;
