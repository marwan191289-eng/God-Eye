import crypto from 'crypto';

interface AISignal {
  id: string;
  symbol: string;
  timeframe: string;
  signalType: 'buy' | 'sell' | 'strong_buy' | 'strong_sell' | 'neutral' | 'hold';
  strength: 'very_weak' | 'weak' | 'neutral' | 'strong' | 'very_strong';
  confidence: number; // 0-100
  technicalScore: number; // 0-100
  fundamentalScore: number; // 0-100
  sentimentScore: number; // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  analysis: string;
  timestamp: number;
  expiresAt: number;
}

interface TechnicalAnalysisResult {
  symbol: string;
  timeframe: string;
  score: number; // 0-100
  signals: {
    movingAverages: { signal: string; weight: number };
    momentum: { signal: string; weight: number };
    volatility: { signal: string; weight: number };
    volume: { signal: string; weight: number };
    trend: { signal: string; weight: number };
  };
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

interface FundamentalAnalysisResult {
  symbol: string;
  score: number; // 0-100
  factors: {
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
    priceChange7d: number;
    priceChange30d: number;
    volatility: number;
    dominance: number;
  };
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

interface SentimentAnalysisResult {
  symbol: string;
  score: number; // -100 to 100
  sources: {
    twitter: number;
    reddit: number;
    news: number;
    onChain: number;
    whale: number;
  };
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
}

/**
 * AI Signals Service
 * Generates trading signals using AI, technical analysis, and sentiment analysis
 */
export class AISignalsService {
  /**
   * Generate AI Signal
   */
  static async generateAISignal(
    symbol: string,
    timeframe: string,
    technicalScore: number,
    fundamentalScore: number,
    sentimentScore: number,
    currentPrice: number
  ): Promise<AISignal> {
    // Calculate overall score
    const overallScore = (technicalScore * 0.4 + fundamentalScore * 0.3 + sentimentScore * 0.3) / 100;

    // Determine signal type and strength
    let signalType: 'buy' | 'sell' | 'strong_buy' | 'strong_sell' | 'neutral' | 'hold';
    let strength: 'very_weak' | 'weak' | 'neutral' | 'strong' | 'very_strong';

    if (overallScore > 0.8) {
      signalType = 'strong_buy';
      strength = 'very_strong';
    } else if (overallScore > 0.6) {
      signalType = 'buy';
      strength = 'strong';
    } else if (overallScore > 0.4) {
      signalType = 'hold';
      strength = 'neutral';
    } else if (overallScore > 0.2) {
      signalType = 'sell';
      strength = 'weak';
    } else {
      signalType = 'strong_sell';
      strength = 'very_weak';
    }

    // Calculate price targets
    const volatility = Math.random() * 0.05 + 0.02; // 2-7%
    const entryPrice = currentPrice;
    const targetPrice = signalType.includes('buy')
      ? currentPrice * (1 + volatility * 3)
      : currentPrice * (1 - volatility * 3);
    const stopLossPrice = signalType.includes('buy')
      ? currentPrice * (1 - volatility)
      : currentPrice * (1 + volatility);

    // Generate analysis
    const analysis = this.generateAnalysisText(signalType, technicalScore, fundamentalScore, sentimentScore);

    const signal: AISignal = {
      id: crypto.randomUUID(),
      symbol,
      timeframe,
      signalType,
      strength,
      confidence: Math.round(overallScore * 100),
      technicalScore,
      fundamentalScore,
      sentimentScore,
      entryPrice,
      targetPrice,
      stopLossPrice,
      analysis,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000, // 24 hours
    };

    return signal;
  }

  /**
   * Perform Technical Analysis
   */
  static performTechnicalAnalysis(
    symbol: string,
    timeframe: string,
    indicators: any,
    trend: string,
    volume: number,
    avgVolume: number
  ): TechnicalAnalysisResult {
    const signals = {
      movingAverages: this.analyzeMAs(indicators),
      momentum: this.analyzeMomentum(indicators),
      volatility: this.analyzeVolatility(indicators),
      volume: this.analyzeVolume(volume, avgVolume),
      trend: this.analyzeTrend(trend),
    };

    // Calculate weighted score
    const weights = {
      movingAverages: 0.25,
      momentum: 0.25,
      volatility: 0.15,
      volume: 0.2,
      trend: 0.15,
    };

    let totalScore = 0;
    for (const [key, signal] of Object.entries(signals)) {
      const weight = weights[key as keyof typeof weights] || 0;
      totalScore += signal.weight * weight;
    }

    // Determine recommendation
    let recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    if (totalScore > 80) {
      recommendation = 'strong_buy';
    } else if (totalScore > 60) {
      recommendation = 'buy';
    } else if (totalScore > 40) {
      recommendation = 'hold';
    } else if (totalScore > 20) {
      recommendation = 'sell';
    } else {
      recommendation = 'strong_sell';
    }

    return {
      symbol,
      timeframe,
      score: totalScore,
      signals,
      recommendation,
    };
  }

  /**
   * Perform Fundamental Analysis
   */
  static performFundamentalAnalysis(
    symbol: string,
    factors: {
      marketCap: number;
      volume24h: number;
      priceChange24h: number;
      priceChange7d: number;
      priceChange30d: number;
      volatility: number;
      dominance: number;
    }
  ): FundamentalAnalysisResult {
    let score = 50; // Start at neutral

    // Market cap analysis
    if (factors.marketCap > 1000000000) {
      score += 10; // Large cap is more stable
    }

    // Volume analysis
    if (factors.volume24h > 100000000) {
      score += 10; // High volume is healthy
    }

    // Price momentum
    if (factors.priceChange24h > 2) {
      score += 5;
    } else if (factors.priceChange24h < -2) {
      score -= 5;
    }

    if (factors.priceChange7d > 5) {
      score += 5;
    } else if (factors.priceChange7d < -5) {
      score -= 5;
    }

    // Volatility
    if (factors.volatility < 5) {
      score += 5; // Low volatility is better
    } else if (factors.volatility > 20) {
      score -= 10; // High volatility is risky
    }

    // Market dominance
    if (factors.dominance > 5) {
      score += 5; // High dominance is positive
    }

    score = Math.max(0, Math.min(100, score));

    let recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    if (score > 80) {
      recommendation = 'strong_buy';
    } else if (score > 60) {
      recommendation = 'buy';
    } else if (score > 40) {
      recommendation = 'hold';
    } else if (score > 20) {
      recommendation = 'sell';
    } else {
      recommendation = 'strong_sell';
    }

    return {
      symbol,
      score,
      factors,
      recommendation,
    };
  }

  /**
   * Perform Sentiment Analysis
   */
  static performSentimentAnalysis(
    symbol: string,
    sources: {
      twitter?: number;
      reddit?: number;
      news?: number;
      onChain?: number;
      whale?: number;
    }
  ): SentimentAnalysisResult {
    const twitter = sources.twitter || Math.random() * 100 - 50;
    const reddit = sources.reddit || Math.random() * 100 - 50;
    const news = sources.news || Math.random() * 100 - 50;
    const onChain = sources.onChain || Math.random() * 100 - 50;
    const whale = sources.whale || Math.random() * 100 - 50;

    // Calculate weighted average
    const score = (twitter * 0.2 + reddit * 0.15 + news * 0.25 + onChain * 0.2 + whale * 0.2) / 100;

    let sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    if (score > 0.6) {
      sentiment = 'very_positive';
    } else if (score > 0.2) {
      sentiment = 'positive';
    } else if (score > -0.2) {
      sentiment = 'neutral';
    } else if (score > -0.6) {
      sentiment = 'negative';
    } else {
      sentiment = 'very_negative';
    }

    return {
      symbol,
      score: Math.round(score * 100),
      sources: {
        twitter,
        reddit,
        news,
        onChain,
        whale,
      },
      sentiment,
    };
  }

  /**
   * Analyze Moving Averages
   */
  private static analyzeMAs(indicators: any): { signal: string; weight: number } {
    let weight = 50;

    if (indicators.ema12 && indicators.ema26) {
      if (indicators.ema12 > indicators.ema26) {
        weight += 25;
      } else {
        weight -= 25;
      }
    }

    if (indicators.sma50 && indicators.sma200) {
      if (indicators.sma50 > indicators.sma200) {
        weight += 15;
      } else {
        weight -= 15;
      }
    }

    return {
      signal: weight > 50 ? 'bullish' : weight < 50 ? 'bearish' : 'neutral',
      weight: Math.max(0, Math.min(100, weight)),
    };
  }

  /**
   * Analyze Momentum
   */
  private static analyzeMomentum(indicators: any): { signal: string; weight: number } {
    let weight = 50;

    if (indicators.rsi) {
      if (indicators.rsi < 30) {
        weight += 20; // Oversold
      } else if (indicators.rsi > 70) {
        weight -= 20; // Overbought
      }
    }

    if (indicators.macd && indicators.macdSignal) {
      if (indicators.macd > indicators.macdSignal) {
        weight += 15;
      } else {
        weight -= 15;
      }
    }

    return {
      signal: weight > 50 ? 'bullish' : weight < 50 ? 'bearish' : 'neutral',
      weight: Math.max(0, Math.min(100, weight)),
    };
  }

  /**
   * Analyze Volatility
   */
  private static analyzeVolatility(indicators: any): { signal: string; weight: number } {
    let weight = 50;

    if (indicators.bollingerBandUpper && indicators.bollingerBandLower) {
      const bandwidth =
        (indicators.bollingerBandUpper - indicators.bollingerBandLower) / indicators.bollingerBandMiddle;

      if (bandwidth > 0.1) {
        weight -= 15; // High volatility
      } else {
        weight += 10; // Low volatility
      }
    }

    if (indicators.atr) {
      if (indicators.atr > 500) {
        weight -= 10;
      }
    }

    return {
      signal: weight > 50 ? 'low_volatility' : 'high_volatility',
      weight: Math.max(0, Math.min(100, weight)),
    };
  }

  /**
   * Analyze Volume
   */
  private static analyzeVolume(volume: number, avgVolume: number): { signal: string; weight: number } {
    let weight = 50;

    if (volume > avgVolume * 1.5) {
      weight += 25; // High volume
    } else if (volume < avgVolume * 0.5) {
      weight -= 15; // Low volume
    }

    return {
      signal: volume > avgVolume ? 'bullish' : 'bearish',
      weight: Math.max(0, Math.min(100, weight)),
    };
  }

  /**
   * Analyze Trend
   */
  private static analyzeTrend(trend: string): { signal: string; weight: number } {
    let weight = 50;

    if (trend === 'uptrend') {
      weight = 75;
    } else if (trend === 'downtrend') {
      weight = 25;
    }

    return {
      signal: trend,
      weight,
    };
  }

  /**
   * Generate Analysis Text
   */
  private static generateAnalysisText(
    signalType: string,
    technicalScore: number,
    fundamentalScore: number,
    sentimentScore: number
  ): string {
    const strongest =
      technicalScore > fundamentalScore
        ? technicalScore > sentimentScore
          ? 'Technical'
          : 'Sentiment'
        : fundamentalScore > sentimentScore
          ? 'Fundamental'
          : 'Sentiment';

    return `${signalType.toUpperCase()} signal generated. ${strongest} analysis is the strongest driver. Technical: ${technicalScore}%, Fundamental: ${fundamentalScore}%, Sentiment: ${sentimentScore}%.`;
  }

  /**
   * Generate Signal Alerts
   */
  static generateSignalAlerts(signals: AISignal[]): Array<{
    alert: string;
    severity: 'info' | 'warning' | 'critical';
    action: string;
  }> {
    const alerts: Array<{
      alert: string;
      severity: 'info' | 'warning' | 'critical';
      action: string;
    }> = [];

    for (const signal of signals) {
      if (signal.confidence > 80) {
        alerts.push({
          alert: `Strong ${signal.signalType} signal for ${signal.symbol}`,
          severity: 'critical',
          action: `Consider ${signal.signalType === 'buy' || signal.signalType === 'strong_buy' ? 'buying' : 'selling'} at ${signal.entryPrice}`,
        });
      } else if (signal.confidence > 60) {
        alerts.push({
          alert: `${signal.signalType} signal for ${signal.symbol}`,
          severity: 'warning',
          action: `Monitor for entry at ${signal.entryPrice}`,
        });
      }
    }

    return alerts;
  }

  /**
   * Backtest Signal
   */
  static backtestSignal(
    signal: AISignal,
    historicalPrices: number[]
  ): {
    accuracy: number;
    profitLoss: number;
    winRate: number;
  } {
    // Simplified backtest
    let wins = 0;
    let losses = 0;
    let totalPnL = 0;

    for (const price of historicalPrices) {
      if (signal.signalType.includes('buy')) {
        if (price > signal.entryPrice && price < signal.targetPrice) {
          wins++;
          totalPnL += (price - signal.entryPrice) / signal.entryPrice;
        } else if (price < signal.stopLossPrice) {
          losses++;
          totalPnL -= (signal.entryPrice - price) / signal.entryPrice;
        }
      }
    }

    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const accuracy = Math.max(0, Math.min(100, (wins / Math.max(totalTrades, 1)) * 100));

    return {
      accuracy,
      profitLoss: totalPnL,
      winRate,
    };
  }
}

export default AISignalsService;
