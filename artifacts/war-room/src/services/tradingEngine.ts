import { v4 as uuidv4 } from 'uuid';

export interface TradeOrder {
  id: string;
  walletId: string;
  symbol: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop-loss' | 'take-profit';
  tradingType: 'spot' | 'futures';
  quantity: number;
  price: number;
  entryPrice?: number;
  exitPrice?: number;
  leverage?: number; // For futures only
  status: 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'failed';
  totalValue: number;
  fee: number;
  platformFee: number;
  profitLoss?: number;
  profitLossPercentage?: number;
  createdAt: Date;
  filledAt?: Date;
  closedAt?: Date;
}

export interface TradingFeeStructure {
  spotMaker: number; // 0.1% = 0.001
  spotTaker: number; // 0.1% = 0.001
  futuresMaker: number; // 0.02% = 0.0002
  futuresTaker: number; // 0.05% = 0.0005
  platformFeePercentage: number; // 10% of trading fee goes to platform
}

export interface TradePosition {
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  openOrders: number;
}

class TradingEngine {
  private orders: Map<string, TradeOrder> = new Map();
  private positions: Map<string, Map<string, TradePosition>> = new Map(); // walletId -> symbol -> position
  private feeStructure: TradingFeeStructure = {
    spotMaker: 0.001,
    spotTaker: 0.001,
    futuresMaker: 0.0002,
    futuresTaker: 0.0005,
    platformFeePercentage: 0.1, // 10% of fees
  };

  // Mock price data (in real implementation, fetch from price feed)
  private priceData: Map<string, number> = new Map([
    ['BTCUSDT', 45000],
    ['ETHUSDT', 2500],
    ['BNBUSDT', 350],
    ['SOLUSDT', 120],
    ['XRPUSDT', 0.52],
    ['ADAUSDT', 0.95],
    ['DOGEUSDT', 0.15],
    ['AVAXUSDT', 35],
  ]);

  /**
   * Create a new trade order
   */
  async createOrder(
    walletId: string,
    symbol: string,
    type: 'buy' | 'sell',
    orderType: 'market' | 'limit' | 'stop-loss' | 'take-profit',
    tradingType: 'spot' | 'futures',
    quantity: number,
    price: number,
    leverage?: number
  ): Promise<TradeOrder> {
    const orderId = uuidv4();
    const currentPrice = this.priceData.get(symbol) || price;
    const totalValue = quantity * currentPrice;

    // Calculate fees
    const makerFee =
      tradingType === 'spot' ? this.feeStructure.spotMaker : this.feeStructure.futuresMaker;
    const takerFee =
      tradingType === 'spot' ? this.feeStructure.spotTaker : this.feeStructure.futuresTaker;
    const fee = totalValue * (orderType === 'limit' ? makerFee : takerFee);
    const platformFee = fee * this.feeStructure.platformFeePercentage;

    const order: TradeOrder = {
      id: orderId,
      walletId,
      symbol,
      type,
      orderType,
      tradingType,
      quantity,
      price: currentPrice,
      leverage: leverage || 1,
      status: 'pending',
      totalValue,
      fee,
      platformFee,
      createdAt: new Date(),
    };

    this.orders.set(orderId, order);

    // Simulate order execution
    setTimeout(() => {
      this.executeOrder(orderId);
    }, 1000);

    return order;
  }

  /**
   * Execute order (fill it)
   */
  private executeOrder(orderId: string): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.status = 'filled';
    order.entryPrice = order.price;
    order.filledAt = new Date();

    // Update position
    this.updatePosition(order.walletId, order.symbol, order);
  }

  /**
   * Update position after trade
   */
  private updatePosition(walletId: string, symbol: string, order: TradeOrder): void {
    if (!this.positions.has(walletId)) {
      this.positions.set(walletId, new Map());
    }

    const walletPositions = this.positions.get(walletId)!;
    const existingPosition = walletPositions.get(symbol);

    if (order.type === 'buy') {
      if (existingPosition) {
        const totalCost =
          existingPosition.quantity * existingPosition.averageEntryPrice +
          order.quantity * order.price;
        const totalQuantity = existingPosition.quantity + order.quantity;
        existingPosition.averageEntryPrice = totalCost / totalQuantity;
        existingPosition.quantity = totalQuantity;
      } else {
        walletPositions.set(symbol, {
          symbol,
          quantity: order.quantity,
          averageEntryPrice: order.price,
          currentPrice: order.price,
          totalValue: order.quantity * order.price,
          profitLoss: 0,
          profitLossPercentage: 0,
          openOrders: 1,
        });
      }
    } else if (order.type === 'sell') {
      if (existingPosition) {
        existingPosition.quantity -= order.quantity;
        if (existingPosition.quantity === 0) {
          walletPositions.delete(symbol);
        }
      }
    }
  }

  /**
   * Close position
   */
  async closePosition(walletId: string, symbol: string, quantity: number): Promise<TradeOrder> {
    const position = this.positions.get(walletId)?.get(symbol);
    if (!position || position.quantity < quantity) {
      throw new Error('Insufficient position to close');
    }

    const currentPrice = this.priceData.get(symbol) || position.currentPrice;
    const order = await this.createOrder(
      walletId,
      symbol,
      'sell',
      'market',
      'spot',
      quantity,
      currentPrice
    );

    // Calculate P&L
    const profitLoss = (currentPrice - position.averageEntryPrice) * quantity;
    order.profitLoss = profitLoss;
    order.profitLossPercentage = (profitLoss / (position.averageEntryPrice * quantity)) * 100;

    return order;
  }

  /**
   * Get user positions
   */
  async getUserPositions(walletId: string): Promise<TradePosition[]> {
    return Array.from(this.positions.get(walletId)?.values() || []);
  }

  /**
   * Get order history
   */
  async getOrderHistory(walletId: string, limit: number = 50): Promise<TradeOrder[]> {
    return Array.from(this.orders.values())
      .filter((o) => o.walletId === walletId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<TradeOrder | null> {
    return this.orders.get(orderId) || null;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'filled') throw new Error('Cannot cancel filled order');

    order.status = 'cancelled';
  }

  /**
   * Update price (simulate price changes)
   */
  updatePrice(symbol: string, price: number): void {
    this.priceData.set(symbol, price);
  }

  /**
   * Get current price
   */
  getPrice(symbol: string): number {
    return this.priceData.get(symbol) || 0;
  }

  /**
   * Get trading statistics
   */
  async getTradingStats(walletId: string) {
    const orders = await this.getOrderHistory(walletId);
    const positions = await this.getUserPositions(walletId);

    const totalTrades = orders.filter((o) => o.status === 'filled').length;
    const totalFees = orders.reduce((sum, o) => sum + o.fee, 0);
    const totalPlatformFees = orders.reduce((sum, o) => sum + o.platformFee, 0);
    const totalVolume = orders.reduce((sum, o) => sum + o.totalValue, 0);
    const winningTrades = orders.filter((o) => o.profitLoss && o.profitLoss > 0).length;
    const losingTrades = orders.filter((o) => o.profitLoss && o.profitLoss < 0).length;
    const totalProfitLoss = orders.reduce((sum, o) => sum + (o.profitLoss || 0), 0);

    return {
      totalTrades,
      totalVolume,
      totalFees,
      totalPlatformFees,
      winningTrades,
      losingTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      totalProfitLoss,
      openPositions: positions.length,
      positions,
    };
  }

  /**
   * Update fee structure
   */
  updateFeeStructure(newStructure: Partial<TradingFeeStructure>): void {
    this.feeStructure = { ...this.feeStructure, ...newStructure };
  }

  /**
   * Get fee structure
   */
  getFeeStructure(): TradingFeeStructure {
    return this.feeStructure;
  }

  /**
   * Search and analyze any crypto asset
   */
  async searchAsset(symbol: string): Promise<{
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
  }> {
    // In real implementation, fetch from CoinGecko or similar API
    const mockAssets: Record<
      string,
      {
        symbol: string;
        name: string;
        price: number;
        change24h: number;
        volume24h: number;
        marketCap: number;
      }
    > = {
      BTCUSDT: {
        symbol: 'BTCUSDT',
        name: 'Bitcoin',
        price: 45000,
        change24h: 2.5,
        volume24h: 28000000000,
        marketCap: 900000000000,
      },
      ETHUSDT: {
        symbol: 'ETHUSDT',
        name: 'Ethereum',
        price: 2500,
        change24h: 1.8,
        volume24h: 15000000000,
        marketCap: 300000000000,
      },
      SOLUSDT: {
        symbol: 'SOLUSDT',
        name: 'Solana',
        price: 120,
        change24h: 3.2,
        volume24h: 2000000000,
        marketCap: 50000000000,
      },
    };

    return (
      mockAssets[symbol] || {
        symbol,
        name: symbol.replace('USDT', ''),
        price: Math.random() * 1000,
        change24h: Math.random() * 10 - 5,
        volume24h: Math.random() * 1000000000,
        marketCap: Math.random() * 100000000000,
      }
    );
  }
}

export const tradingEngine = new TradingEngine();
