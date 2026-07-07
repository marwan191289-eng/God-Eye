import crypto from 'crypto';

interface OrderRequest {
  userId: string;
  symbol: string;
  orderType: 'limit' | 'market' | 'stop_loss' | 'take_profit' | 'stop_limit' | 'trailing_stop' | 'iceberg' | 'post_only';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  stopPrice?: number;
  takeProfitPrice?: number;
  leverage?: string;
  marginType?: 'isolated' | 'cross';
  tradingMode: 'spot' | 'margin' | 'futures' | 'options';
  clientOrderId?: string;
}

interface Order {
  id: string;
  userId: string;
  symbol: string;
  orderType: string;
  side: string;
  quantity: number;
  executedQuantity: number;
  remainingQuantity: number;
  price?: number;
  averagePrice: number;
  status: 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected';
  fee: number;
  feeCurrency: string;
  createdAt: number;
  updatedAt: number;
  filledAt?: number;
  cancelledAt?: number;
}

interface Trade {
  id: string;
  userId: string;
  orderId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  total: number;
  fee: number;
  feeCurrency: string;
  createdAt: number;
}

interface Position {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
  realizedPnL: number;
  leverage: string;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  liquidationPrice?: number;
  isOpen: boolean;
  createdAt: number;
  closedAt?: number;
}

interface GridBotConfig {
  symbol: string;
  gridType: 'long' | 'short' | 'neutral';
  gridCount: number;
  lowerPrice: number;
  upperPrice: number;
  investmentAmount: number;
}

interface CopyTradingConfig {
  followerId: string;
  leaderId: string;
  copyRatio: number;
  maxCopyAmount?: number;
}

/**
 * Trading Engine Service
 * Handles order placement, execution, position management, and advanced trading features
 */
export class TradingEngineService {
  private static readonly MAKER_FEE = 0.001; // 0.1%
  private static readonly TAKER_FEE = 0.0015; // 0.15%
  private static readonly MARGIN_INTEREST_RATE = 0.0001; // 0.01% per day

  /**
   * Place Order
   */
  static async placeOrder(orderRequest: OrderRequest): Promise<Order> {
    // Validate order
    const validation = this.validateOrder(orderRequest);
    if (!validation.isValid) {
      throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
    }

    const order: Order = {
      id: crypto.randomUUID(),
      userId: orderRequest.userId,
      symbol: orderRequest.symbol,
      orderType: orderRequest.orderType,
      side: orderRequest.side,
      quantity: orderRequest.quantity,
      executedQuantity: 0,
      remainingQuantity: orderRequest.quantity,
      price: orderRequest.price,
      averagePrice: 0,
      status: 'open',
      fee: 0,
      feeCurrency: 'USDT',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // For market orders, execute immediately
    if (orderRequest.orderType === 'market') {
      return this.executeMarketOrder(order);
    }

    return order;
  }

  /**
   * Execute Market Order
   */
  static async executeMarketOrder(order: Order): Promise<Order> {
    // Simulate market order execution
    const executedQuantity = order.quantity;
    const fee = this.calculateFee(order.quantity, order.price || 0, 'taker');

    order.executedQuantity = executedQuantity;
    order.remainingQuantity = 0;
    order.averagePrice = order.price || 0;
    order.fee = fee;
    order.status = 'filled';
    order.filledAt = Date.now();
    order.updatedAt = Date.now();

    return order;
  }

  /**
   * Execute Limit Order
   */
  static async executeLimitOrder(order: Order, currentPrice: number): Promise<Order> {
    if (!order.price) {
      throw new Error('Limit order must have a price');
    }

    // Check if order can be filled
    const canFill =
      (order.side === 'buy' && currentPrice <= order.price) ||
      (order.side === 'sell' && currentPrice >= order.price);

    if (canFill) {
      const fee = this.calculateFee(order.quantity, currentPrice, 'maker');

      order.executedQuantity = order.quantity;
      order.remainingQuantity = 0;
      order.averagePrice = currentPrice;
      order.fee = fee;
      order.status = 'filled';
      order.filledAt = Date.now();
    }

    order.updatedAt = Date.now();
    return order;
  }

  /**
   * Cancel Order
   */
  static async cancelOrder(orderId: string, order: Order): Promise<Order> {
    if (order.status === 'filled' || order.status === 'cancelled') {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    order.status = 'cancelled';
    order.cancelledAt = Date.now();
    order.updatedAt = Date.now();

    return order;
  }

  /**
   * Create Trade from Order
   */
  static createTradeFromOrder(order: Order): Trade {
    if (order.executedQuantity === 0) {
      throw new Error('Cannot create trade from unfilled order');
    }

    return {
      id: crypto.randomUUID(),
      userId: order.userId,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.executedQuantity,
      price: order.averagePrice,
      total: order.executedQuantity * order.averagePrice,
      fee: order.fee,
      feeCurrency: order.feeCurrency,
      createdAt: order.filledAt || Date.now(),
    };
  }

  /**
   * Open Position
   */
  static openPosition(
    userId: string,
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    entryPrice: number,
    leverage: string = '1x',
    stopLossPrice?: number,
    takeProfitPrice?: number
  ): Position {
    const leverageMultiplier = parseInt(leverage) || 1;
    const liquidationPrice = this.calculateLiquidationPrice(entryPrice, side, leverageMultiplier);

    return {
      id: crypto.randomUUID(),
      userId,
      symbol,
      side,
      quantity,
      entryPrice,
      currentPrice: entryPrice,
      unrealizedPnL: 0,
      unrealizedPnLPercentage: 0,
      realizedPnL: 0,
      leverage,
      stopLossPrice,
      takeProfitPrice,
      liquidationPrice,
      isOpen: true,
      createdAt: Date.now(),
    };
  }

  /**
   * Update Position P&L
   */
  static updatePositionPnL(position: Position, currentPrice: number): Position {
    position.currentPrice = currentPrice;

    const priceDifference = currentPrice - position.entryPrice;
    const multiplier = position.side === 'buy' ? 1 : -1;

    position.unrealizedPnL = priceDifference * position.quantity * multiplier;
    position.unrealizedPnLPercentage = (priceDifference / position.entryPrice) * 100 * multiplier;

    // Check for liquidation
    if (position.liquidationPrice) {
      const isLiquidated =
        (position.side === 'buy' && currentPrice <= position.liquidationPrice) ||
        (position.side === 'sell' && currentPrice >= position.liquidationPrice);

      if (isLiquidated) {
        position.isOpen = false;
        position.closedAt = Date.now();
        position.realizedPnL = position.unrealizedPnL;
      }
    }

    // Check for stop loss
    if (position.stopLossPrice) {
      const hitStopLoss =
        (position.side === 'buy' && currentPrice <= position.stopLossPrice) ||
        (position.side === 'sell' && currentPrice >= position.stopLossPrice);

      if (hitStopLoss) {
        position.isOpen = false;
        position.closedAt = Date.now();
        position.realizedPnL = position.unrealizedPnL;
      }
    }

    // Check for take profit
    if (position.takeProfitPrice) {
      const hitTakeProfit =
        (position.side === 'buy' && currentPrice >= position.takeProfitPrice) ||
        (position.side === 'sell' && currentPrice <= position.takeProfitPrice);

      if (hitTakeProfit) {
        position.isOpen = false;
        position.closedAt = Date.now();
        position.realizedPnL = position.unrealizedPnL;
      }
    }

    return position;
  }

  /**
   * Close Position
   */
  static closePosition(position: Position, exitPrice: number): Position {
    if (!position.isOpen) {
      throw new Error('Position is already closed');
    }

    const priceDifference = exitPrice - position.entryPrice;
    const multiplier = position.side === 'buy' ? 1 : -1;

    position.realizedPnL = priceDifference * position.quantity * multiplier;
    position.isOpen = false;
    position.closedAt = Date.now();

    return position;
  }

  /**
   * Create Grid Bot
   */
  static createGridBot(userId: string, config: GridBotConfig): {
    botId: string;
    gridPrices: number[];
    gridOrders: number;
  } {
    const botId = crypto.randomUUID();
    const gridPrices: number[] = [];

    // Generate grid prices
    const priceRange = config.upperPrice - config.lowerPrice;
    const priceStep = priceRange / (config.gridCount - 1);

    for (let i = 0; i < config.gridCount; i++) {
      gridPrices.push(config.lowerPrice + priceStep * i);
    }

    // Calculate order amount per grid
    const orderAmountPerGrid = config.investmentAmount / config.gridCount;

    return {
      botId,
      gridPrices,
      gridOrders: config.gridCount,
    };
  }

  /**
   * Execute Grid Bot Orders
   */
  static executeGridBotOrders(
    gridPrices: number[],
    gridType: 'long' | 'short' | 'neutral',
    orderAmountPerGrid: number
  ): Order[] {
    const orders: Order[] = [];

    for (let i = 0; i < gridPrices.length; i++) {
      const price = gridPrices[i];

      if (gridType === 'long' && i < gridPrices.length / 2) {
        // Buy orders for long grid
        orders.push({
          id: crypto.randomUUID(),
          userId: '',
          symbol: '',
          orderType: 'limit',
          side: 'buy',
          quantity: orderAmountPerGrid / price,
          executedQuantity: 0,
          remainingQuantity: orderAmountPerGrid / price,
          price,
          averagePrice: 0,
          status: 'open',
          fee: 0,
          feeCurrency: 'USDT',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else if (gridType === 'short' && i >= gridPrices.length / 2) {
        // Sell orders for short grid
        orders.push({
          id: crypto.randomUUID(),
          userId: '',
          symbol: '',
          orderType: 'limit',
          side: 'sell',
          quantity: orderAmountPerGrid / price,
          executedQuantity: 0,
          remainingQuantity: orderAmountPerGrid / price,
          price,
          averagePrice: 0,
          status: 'open',
          fee: 0,
          feeCurrency: 'USDT',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    return orders;
  }

  /**
   * Setup Copy Trading
   */
  static setupCopyTrading(config: CopyTradingConfig): {
    copyTradeId: string;
    status: string;
  } {
    return {
      copyTradeId: crypto.randomUUID(),
      status: 'active',
    };
  }

  /**
   * Copy Trade Execution
   */
  static executeCopyTrade(
    leaderOrder: Order,
    followerConfig: CopyTradingConfig
  ): Order {
    const copiedQuantity = leaderOrder.quantity * followerConfig.copyRatio;

    // Check max copy amount
    if (
      followerConfig.maxCopyAmount &&
      copiedQuantity * (leaderOrder.price || 0) > followerConfig.maxCopyAmount
    ) {
      return {
        ...leaderOrder,
        id: crypto.randomUUID(),
        quantity: followerConfig.maxCopyAmount / (leaderOrder.price || 1),
        remainingQuantity: followerConfig.maxCopyAmount / (leaderOrder.price || 1),
      };
    }

    return {
      ...leaderOrder,
      id: crypto.randomUUID(),
      quantity: copiedQuantity,
      remainingQuantity: copiedQuantity,
    };
  }

  /**
   * Calculate Fee
   */
  static calculateFee(quantity: number, price: number, feeType: 'maker' | 'taker'): number {
    const feeRate = feeType === 'maker' ? this.MAKER_FEE : this.TAKER_FEE;
    return quantity * price * feeRate;
  }

  /**
   * Calculate Liquidation Price
   */
  static calculateLiquidationPrice(
    entryPrice: number,
    side: 'buy' | 'sell',
    leverage: number
  ): number {
    // Simplified liquidation price calculation
    // In production, this would be more complex
    const liquidationThreshold = 0.05; // 5%

    if (side === 'buy') {
      return entryPrice * (1 - liquidationThreshold / leverage);
    } else {
      return entryPrice * (1 + liquidationThreshold / leverage);
    }
  }

  /**
   * Validate Order
   */
  static validateOrder(order: OrderRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!order.symbol) {
      errors.push('Symbol is required');
    }

    if (order.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (order.orderType === 'limit' && !order.price) {
      errors.push('Price is required for limit orders');
    }

    if (order.orderType === 'stop_loss' && !order.stopPrice) {
      errors.push('Stop price is required for stop loss orders');
    }

    if (order.orderType === 'take_profit' && !order.takeProfitPrice) {
      errors.push('Take profit price is required for take profit orders');
    }

    if (order.leverage && !['1x', '2x', '3x', '5x', '10x', '20x', '50x', '100x'].includes(order.leverage)) {
      errors.push('Invalid leverage value');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate Portfolio Value
   */
  static calculatePortfolioValue(positions: Position[], walletBalance: number): number {
    let totalValue = walletBalance;

    for (const position of positions) {
      if (position.isOpen) {
        totalValue += position.unrealizedPnL;
      }
    }

    return totalValue;
  }

  /**
   * Calculate Portfolio Metrics
   */
  static calculatePortfolioMetrics(
    positions: Position[],
    trades: Trade[],
    walletBalance: number
  ): {
    totalValue: number;
    totalPnL: number;
    totalPnLPercentage: number;
    winRate: number;
    profitFactor: number;
  } {
    const totalValue = this.calculatePortfolioValue(positions, walletBalance);

    // Calculate total PnL
    let totalPnL = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalProfit = 0;
    let totalLoss = 0;

    for (const position of positions) {
      totalPnL += position.realizedPnL;
    }

    for (const trade of trades) {
      const pnl = trade.total - trade.fee;
      if (pnl > 0) {
        winningTrades++;
        totalProfit += pnl;
      } else {
        losingTrades++;
        totalLoss += Math.abs(pnl);
      }
    }

    const totalTrades = winningTrades + losingTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 1 : 0;

    return {
      totalValue,
      totalPnL,
      totalPnLPercentage: walletBalance > 0 ? (totalPnL / walletBalance) * 100 : 0,
      winRate,
      profitFactor,
    };
  }
}

export default TradingEngineService;
