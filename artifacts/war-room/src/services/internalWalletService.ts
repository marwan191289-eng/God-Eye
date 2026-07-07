import { v4 as uuidv4 } from 'uuid';

export interface InternalWallet {
  id: string;
  userId: string;
  walletAddress: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'fee' | 'refund';
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  transactionHash?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface DepositRequest {
  walletId: string;
  amount: number;
  paymentMethod: 'card' | 'bank' | 'crypto' | 'paypal';
  currency: string;
}

export interface WithdrawalRequest {
  walletId: string;
  amount: number;
  destination: string; // wallet address or bank account
  fee: number;
}

class InternalWalletService {
  private wallets: Map<string, InternalWallet> = new Map();
  private transactions: Map<string, WalletTransaction> = new Map();

  /**
   * Create a new internal wallet for a user
   */
  async createWallet(userId: string): Promise<InternalWallet> {
    const walletId = uuidv4();
    const wallet: InternalWallet = {
      id: walletId,
      userId,
      walletAddress: `0x${Math.random().toString(16).slice(2)}`, // Placeholder
      balance: 0,
      availableBalance: 0,
      lockedBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    this.wallets.set(walletId, wallet);
    return wallet;
  }

  /**
   * Get wallet by ID
   */
  async getWallet(walletId: string): Promise<InternalWallet | null> {
    return this.wallets.get(walletId) || null;
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: string): Promise<InternalWallet[]> {
    return Array.from(this.wallets.values()).filter((w) => w.userId === userId);
  }

  /**
   * Process deposit
   */
  async processDeposit(request: DepositRequest): Promise<WalletTransaction> {
    const wallet = await this.getWallet(request.walletId);
    if (!wallet) throw new Error('Wallet not found');

    const transaction: WalletTransaction = {
      id: uuidv4(),
      walletId: request.walletId,
      type: 'deposit',
      amount: request.amount,
      fee: 0, // No deposit fee for now
      status: 'pending',
      description: `Deposit via ${request.paymentMethod}`,
      createdAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);

    // Simulate processing delay
    setTimeout(() => {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      wallet.balance += request.amount;
      wallet.availableBalance += request.amount;
      wallet.updatedAt = new Date();
    }, 2000);

    return transaction;
  }

  /**
   * Process withdrawal
   */
  async processWithdrawal(request: WithdrawalRequest): Promise<WalletTransaction> {
    const wallet = await this.getWallet(request.walletId);
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.availableBalance < request.amount + request.fee) {
      throw new Error('Insufficient balance');
    }

    const transaction: WalletTransaction = {
      id: uuidv4(),
      walletId: request.walletId,
      type: 'withdrawal',
      amount: request.amount,
      fee: request.fee,
      status: 'pending',
      description: `Withdrawal to ${request.destination}`,
      createdAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);

    // Lock the balance
    wallet.availableBalance -= request.amount + request.fee;
    wallet.lockedBalance += request.amount + request.fee;

    // Simulate processing
    setTimeout(() => {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      wallet.balance -= request.amount + request.fee;
      wallet.lockedBalance -= request.amount + request.fee;
      wallet.updatedAt = new Date();
    }, 3000);

    return transaction;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(walletId: string, limit: number = 50): Promise<WalletTransaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.walletId === walletId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Lock balance for trading
   */
  async lockBalance(walletId: string, amount: number): Promise<void> {
    const wallet = await this.getWallet(walletId);
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.availableBalance < amount) throw new Error('Insufficient available balance');

    wallet.availableBalance -= amount;
    wallet.lockedBalance += amount;
    wallet.updatedAt = new Date();
  }

  /**
   * Unlock balance (e.g., when trade is cancelled)
   */
  async unlockBalance(walletId: string, amount: number): Promise<void> {
    const wallet = await this.getWallet(walletId);
    if (!wallet) throw new Error('Wallet not found');

    wallet.availableBalance += amount;
    wallet.lockedBalance -= amount;
    wallet.updatedAt = new Date();
  }

  /**
   * Deduct fee from wallet
   */
  async deductFee(walletId: string, feeAmount: number, reason: string): Promise<WalletTransaction> {
    const wallet = await this.getWallet(walletId);
    if (!wallet) throw new Error('Wallet not found');

    const transaction: WalletTransaction = {
      id: uuidv4(),
      walletId,
      type: 'fee',
      amount: feeAmount,
      fee: 0,
      status: 'completed',
      description: reason,
      createdAt: new Date(),
      completedAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);
    wallet.balance -= feeAmount;
    wallet.availableBalance -= feeAmount;
    wallet.updatedAt = new Date();

    return transaction;
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(walletId: string) {
    const wallet = await this.getWallet(walletId);
    if (!wallet) throw new Error('Wallet not found');

    const transactions = await this.getTransactionHistory(walletId);
    const deposits = transactions
      .filter((t) => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawals = transactions
      .filter((t) => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    const fees = transactions
      .filter((t) => t.type === 'fee' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      wallet,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      totalFees: fees,
      netBalance: deposits - withdrawals - fees,
      transactionCount: transactions.length,
    };
  }
}

export const internalWalletService = new InternalWalletService();
