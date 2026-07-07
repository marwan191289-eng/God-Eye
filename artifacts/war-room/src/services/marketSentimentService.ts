import { v4 as uuidv4 } from 'uuid';

export interface SentimentAnalysis {
  id: string;
  symbol: string;
  timestamp: Date;
  overallSentiment: 'extremely_bullish' | 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish' | 'extremely_bearish';
  sentimentScore: number; // -100 to 100
  confidence: number; // 0 to 100
  sources: SentimentSource[];
  trendingTopics: string[];
  influencerMentions: number;
  socialMediaVolume: number;
  newsVolume: number;
  onChainMetrics: OnChainMetrics;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
}

export interface SentimentSource {
  source: 'twitter' | 'reddit' | 'news' | 'on_chain' | 'exchange' | 'influencer';
  sentiment: number; // -100 to 100
  volume: number;
  weight: number; // 0 to 1
}

export interface OnChainMetrics {
  largeTransactions: number;
  whaleActivity: 'high' | 'medium' | 'low';
  exchangeInflow: number;
  exchangeOutflow: number;
  activeAddresses: number;
  transactionVolume: number;
}

export interface ViralTrend {
  id: string;
  symbol: string;
  trend: string;
  trendType: 'bullish' | 'bearish' | 'neutral';
  mentions: number;
  engagement: number;
  sources: string[];
  timestamp: Date;
  viralScore: number; // 0 to 100
}

export interface MarketAlert {
  id: string;
  symbol: string;
  alertType: 'sentiment_shift' | 'whale_activity' | 'viral_trend' | 'price_anomaly' | 'exchange_movement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  actionable: boolean;
}

class MarketSentimentService {
  private sentimentAnalyses: Map<string, SentimentAnalysis[]> = new Map();
  private viralTrends: ViralTrend[] = [];
  private marketAlerts: MarketAlert[] = [];

  /**
   * Analyze market sentiment for a symbol
   */
  async analyzeMarketSentiment(symbol: string): Promise<SentimentAnalysis> {
    const sentimentId = uuidv4();

    // Simulate sentiment analysis from multiple sources
    const twitterSentiment = this.analyzeSocialMediaSentiment('twitter', symbol);
    const redditSentiment = this.analyzeSocialMediaSentiment('reddit', symbol);
    const newsSentiment = this.analyzeNewsSentiment(symbol);
    const onChainSentiment = this.analyzeOnChainSentiment(symbol);
    const exchangeSentiment = this.analyzeExchangeSentiment(symbol);

    // Combine sentiments with weighted average
    const sources: SentimentSource[] = [
      { source: 'twitter', sentiment: twitterSentiment, volume: Math.random() * 10000, weight: 0.25 },
      { source: 'reddit', sentiment: redditSentiment, volume: Math.random() * 5000, weight: 0.15 },
      { source: 'news', sentiment: newsSentiment, volume: Math.random() * 3000, weight: 0.20 },
      { source: 'on_chain', sentiment: onChainSentiment, volume: Math.random() * 8000, weight: 0.25 },
      { source: 'exchange', sentiment: exchangeSentiment, volume: Math.random() * 6000, weight: 0.15 },
    ];

    const overallScore = sources.reduce((sum, s) => sum + s.sentiment * s.weight, 0);
    const confidence = Math.min(100, 50 + Math.abs(overallScore) / 2);

    const sentiment: SentimentAnalysis = {
      id: sentimentId,
      symbol,
      timestamp: new Date(),
      overallSentiment: this.getSentimentLabel(overallScore),
      sentimentScore: Math.round(overallScore),
      confidence: Math.round(confidence),
      sources,
      trendingTopics: this.getTrendingTopics(symbol),
      influencerMentions: Math.floor(Math.random() * 500),
      socialMediaVolume: Math.floor(Math.random() * 50000),
      newsVolume: Math.floor(Math.random() * 100),
      onChainMetrics: this.getOnChainMetrics(symbol),
      recommendation: this.getRecommendation(overallScore),
      riskLevel: this.getRiskLevel(overallScore, confidence),
    };

    // Store sentiment analysis
    if (!this.sentimentAnalyses.has(symbol)) {
      this.sentimentAnalyses.set(symbol, []);
    }
    this.sentimentAnalyses.get(symbol)!.push(sentiment);

    // Generate alerts if needed
    this.generateSentimentAlerts(sentiment);

    return sentiment;
  }

  /**
   * Analyze social media sentiment
   */
  private analyzeSocialMediaSentiment(platform: 'twitter' | 'reddit', symbol: string): number {
    // Simulate sentiment analysis
    const baseScore = Math.random() * 200 - 100;
    const volatility = Math.random() * 30 - 15;
    return Math.max(-100, Math.min(100, baseScore + volatility));
  }

  /**
   * Analyze news sentiment
   */
  private analyzeNewsSentiment(symbol: string): number {
    // Simulate news sentiment analysis
    const newsScore = Math.random() * 200 - 100;
    return Math.max(-100, Math.min(100, newsScore));
  }

  /**
   * Analyze on-chain sentiment
   */
  private analyzeOnChainSentiment(symbol: string): number {
    // Simulate on-chain metrics analysis
    const onChainScore = Math.random() * 200 - 100;
    return Math.max(-100, Math.min(100, onChainScore));
  }

  /**
   * Analyze exchange sentiment
   */
  private analyzeExchangeSentiment(symbol: string): number {
    // Simulate exchange data analysis
    const exchangeScore = Math.random() * 200 - 100;
    return Math.max(-100, Math.min(100, exchangeScore));
  }

  /**
   * Get sentiment label
   */
  private getSentimentLabel(score: number): SentimentAnalysis['overallSentiment'] {
    if (score >= 75) return 'extremely_bullish';
    if (score >= 50) return 'very_bullish';
    if (score >= 25) return 'bullish';
    if (score >= -25) return 'neutral';
    if (score >= -50) return 'bearish';
    if (score >= -75) return 'very_bearish';
    return 'extremely_bearish';
  }

  /**
   * Get recommendation based on sentiment
   */
  private getRecommendation(score: number): SentimentAnalysis['recommendation'] {
    if (score >= 60) return 'strong_buy';
    if (score >= 20) return 'buy';
    if (score >= -20) return 'hold';
    if (score >= -60) return 'sell';
    return 'strong_sell';
  }

  /**
   * Get risk level
   */
  private getRiskLevel(score: number, confidence: number): SentimentAnalysis['riskLevel'] {
    const riskScore = Math.abs(score) * (1 - confidence / 100);
    if (riskScore < 10) return 'very_low';
    if (riskScore < 25) return 'low';
    if (riskScore < 50) return 'medium';
    if (riskScore < 75) return 'high';
    return 'very_high';
  }

  /**
   * Get trending topics
   */
  private getTrendingTopics(symbol: string): string[] {
    const topics = [
      `${symbol} price prediction`,
      `${symbol} technical analysis`,
      `${symbol} buy signal`,
      `${symbol} partnership news`,
      `${symbol} whale activity`,
      `${symbol} exchange listing`,
      `${symbol} regulatory update`,
      `${symbol} community growth`,
    ];
    return topics.sort(() => Math.random() - 0.5).slice(0, 3);
  }

  /**
   * Get on-chain metrics
   */
  private getOnChainMetrics(symbol: string): OnChainMetrics {
    return {
      largeTransactions: Math.floor(Math.random() * 1000),
      whaleActivity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
      exchangeInflow: Math.random() * 1000000,
      exchangeOutflow: Math.random() * 1000000,
      activeAddresses: Math.floor(Math.random() * 100000),
      transactionVolume: Math.random() * 10000000,
    };
  }

  /**
   * Generate sentiment-based alerts
   */
  private generateSentimentAlerts(sentiment: SentimentAnalysis): void {
    // Generate alert if sentiment shifts dramatically
    if (Math.abs(sentiment.sentimentScore) > 70) {
      const alert: MarketAlert = {
        id: uuidv4(),
        symbol: sentiment.symbol,
        alertType: 'sentiment_shift',
        severity: Math.abs(sentiment.sentimentScore) > 85 ? 'critical' : 'high',
        message: `Major sentiment shift detected for ${sentiment.symbol}: ${sentiment.overallSentiment}`,
        timestamp: new Date(),
        actionable: true,
      };
      this.marketAlerts.push(alert);
    }

    // Generate alert if whale activity is high
    if (sentiment.onChainMetrics.whaleActivity === 'high') {
      const alert: MarketAlert = {
        id: uuidv4(),
        symbol: sentiment.symbol,
        alertType: 'whale_activity',
        severity: 'high',
        message: `High whale activity detected for ${sentiment.symbol}`,
        timestamp: new Date(),
        actionable: true,
      };
      this.marketAlerts.push(alert);
    }
  }

  /**
   * Get sentiment history
   */
  getSentimentHistory(symbol: string, limit: number = 50): SentimentAnalysis[] {
    return (this.sentimentAnalyses.get(symbol) || []).slice(-limit).reverse();
  }

  /**
   * Detect viral trends
   */
  async detectViralTrends(): Promise<ViralTrend[]> {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
    const trends: ViralTrend[] = [];

    for (const symbol of symbols) {
      if (Math.random() > 0.5) {
        const trend: ViralTrend = {
          id: uuidv4(),
          symbol,
          trend: `${symbol} gaining momentum on social media`,
          trendType: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)] as any,
          mentions: Math.floor(Math.random() * 100000),
          engagement: Math.floor(Math.random() * 500000),
          sources: ['twitter', 'reddit', 'tiktok'].sort(() => Math.random() - 0.5).slice(0, 2),
          timestamp: new Date(),
          viralScore: Math.floor(Math.random() * 100),
        };
        trends.push(trend);
      }
    }

    this.viralTrends = trends;
    return trends;
  }

  /**
   * Get viral trends
   */
  getViralTrends(): ViralTrend[] {
    return this.viralTrends.sort((a, b) => b.viralScore - a.viralScore);
  }

  /**
   * Get market alerts
   */
  getMarketAlerts(limit: number = 50): MarketAlert[] {
    return this.marketAlerts.slice(-limit).reverse();
  }

  /**
   * Get alerts for a specific symbol
   */
  getSymbolAlerts(symbol: string): MarketAlert[] {
    return this.marketAlerts.filter((a) => a.symbol === symbol);
  }

  /**
   * Get critical alerts
   */
  getCriticalAlerts(): MarketAlert[] {
    return this.marketAlerts.filter((a) => a.severity === 'critical');
  }

  /**
   * Compare sentiment across symbols
   */
  compareSentiments(symbols: string[]): Record<string, SentimentAnalysis | null> {
    const comparison: Record<string, SentimentAnalysis | null> = {};
    for (const symbol of symbols) {
      const history = this.getSentimentHistory(symbol, 1);
      comparison[symbol] = history.length > 0 ? history[0] : null;
    }
    return comparison;
  }

  /**
   * Get sentiment trend
   */
  getSentimentTrend(symbol: string, period: number = 10): number[] {
    const history = this.getSentimentHistory(symbol, period);
    return history.map((s) => s.sentimentScore);
  }

  /**
   * Predict next move based on sentiment
   */
  predictNextMove(symbol: string): { direction: 'up' | 'down' | 'sideways'; confidence: number } {
    const history = this.getSentimentHistory(symbol, 5);
    if (history.length === 0) {
      return { direction: 'sideways', confidence: 0 };
    }

    const latestSentiment = history[0];
    const avgSentiment = history.reduce((sum, s) => sum + s.sentimentScore, 0) / history.length;
    const trend = latestSentiment.sentimentScore - avgSentiment;

    if (trend > 20) {
      return { direction: 'up', confidence: Math.min(100, 50 + Math.abs(trend)) };
    } else if (trend < -20) {
      return { direction: 'down', confidence: Math.min(100, 50 + Math.abs(trend)) };
    } else {
      return { direction: 'sideways', confidence: 30 };
    }
  }
}

export const marketSentimentService = new MarketSentimentService();
