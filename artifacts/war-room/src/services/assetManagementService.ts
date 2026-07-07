import crypto from 'crypto';

interface Wallet {
  id: string;
  userId: string;
  walletType: 'spot' | 'margin' | 'futures' | 'savings' | 'staking';
  currency: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  balanceInUSD: number;
  status: 'active' | 'frozen' | 'suspended' | 'closed';
  createdAt: number;
  updatedAt: number;
}

interface DepositRequest {
  userId: string;
  currency: string;
  network: string;
  amount: number;
}

interface WithdrawalRequest {
  userId: string;
  currency: string;
  amount: number;
  address: string;
  network: string;
}

interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'trade' | 'fee' | 'reward';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  fee: number;
  feeCurrency: string;
  description: string;
  createdAt: number;
  completedAt?: number;
}

interface DepositAddress {
  id: string;
  userId: string;
  currency: string;
  network: string;
  address: string;
  tag?: string;
  isActive: boolean;
  createdAt: number;
}

interface WithdrawalWhitelist {
  id: string;
  userId: string;
  address: string;
  label: string;
  currency: string;
  network: string;
  verified: boolean;
  createdAt: number;
}

interface PortfolioSummary {
  totalBalance: number;
  totalBalanceInUSD: number;
  wallets: Wallet[];
  topAssets: Array<{
    currency: string;
    balance: number;
    percentage: number;
    balanceInUSD: number;
  }>;
  recentTransactions: Transaction[];
}

/**
 * Asset Management Service
 * Handles wallet management, deposits, withdrawals, and asset management
 */
export class AssetManagementService {
  /**
   * Create Wallet
   */
  static createWallet(
    userId: string,
    walletType: 'spot' | 'margin' | 'futures' | 'savings' | 'staking',
    currency: string
  ): Wallet {
    return {
      id: crypto.randomUUID(),
      userId,
      walletType,
      currency,
      balance: 0,
      availableBalance: 0,
      lockedBalance: 0,
      balanceInUSD: 0,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Get Wallet Balance
   */
  static getWalletBalance(wallet: Wallet): {
    total: number;
    available: number;
    locked: number;
  } {
    return {
      total: wallet.balance,
      available: wallet.availableBalance,
      locked: wallet.lockedBalance,
    };
  }

  /**
   * Update Wallet Balance
   */
  static updateWalletBalance(
    wallet: Wallet,
    amount: number,
    type: 'deposit' | 'withdrawal' | 'lock' | 'unlock'
  ): Wallet {
    switch (type) {
      case 'deposit':
        wallet.balance += amount;
        wallet.availableBalance += amount;
        break;
      case 'withdrawal':
        if (wallet.availableBalance < amount) {
          throw new Error('Insufficient available balance');
        }
        wallet.balance -= amount;
        wallet.availableBalance -= amount;
        break;
      case 'lock':
        if (wallet.availableBalance < amount) {
          throw new Error('Insufficient available balance to lock');
        }
        wallet.availableBalance -= amount;
        wallet.lockedBalance += amount;
        break;
      case 'unlock':
        if (wallet.lockedBalance < amount) {
          throw new Error('Insufficient locked balance to unlock');
        }
        wallet.lockedBalance -= amount;
        wallet.availableBalance += amount;
        break;
    }

    wallet.updatedAt = Date.now();
    return wallet;
  }

  /**
   * Create Deposit Request
   */
  static createDepositRequest(request: DepositRequest): DepositAddress {
    const address = this.generateDepositAddress(request.currency, request.network);

    return {
      id: crypto.randomUUID(),
      userId: request.userId,
      currency: request.currency,
      network: request.network,
      address,
      isActive: true,
      createdAt: Date.now(),
    };
  }

  /**
   * Generate Deposit Address
   */
  static generateDepositAddress(currency: string, network: string): string {
    const prefixes: { [key: string]: string } = {
      BTC: '1',
      ETH: '0x',
      USDT: '0x',
      BNB: 'bnb1',
      XRP: 'r',
    };

    const prefix = prefixes[currency] || '0x';
    const randomPart = crypto.randomBytes(20).toString('hex');

    return prefix + randomPart;
  }

  /**
   * Create Withdrawal Request
   */
  static createWithdrawalRequest(request: WithdrawalRequest): Transaction {
    return {
      id: crypto.randomUUID(),
      userId: request.userId,
      walletId: crypto.randomUUID(),
      type: 'withdrawal',
      amount: request.amount,
      currency: request.currency,
      status: 'pending',
      fee: this.calculateWithdrawalFee(request.amount, request.currency),
      feeCurrency: request.currency,
      description: `Withdrawal to ${request.address.substring(0, 10)}...`,
      createdAt: Date.now(),
    };
  }

  /**
   * Calculate Withdrawal Fee
   */
  static calculateWithdrawalFee(amount: number, currency: string): number {
    const feePercentages: { [key: string]: number } = {
      BTC: 0.0005,
      ETH: 0.005,
      USDT: 1,
      BNB: 0.0005,
      XRP: 0.1,
    };

    const feePercent = feePercentages[currency] || 0.001;

    if (currency === 'USDT' || currency === 'XRP') {
      return feePercent;
    }

    return amount * feePercent;
  }

  /**
   * Add to Withdrawal Whitelist
   */
  static addToWithdrawalWhitelist(
    userId: string,
    address: string,
    label: string,
    currency: string,
    network: string
  ): WithdrawalWhitelist {
    return {
      id: crypto.randomUUID(),
      userId,
      address,
      label,
      currency,
      network,
      verified: false,
      createdAt: Date.now(),
    };
  }

  /**
   * Verify Withdrawal Address
   */
  static verifyWithdrawalAddress(whitelist: WithdrawalWhitelist, verificationCode: string): boolean {
    return verificationCode.length === 6 && /^\d+$/.test(verificationCode);
  }

  /**
   * Process Deposit
   */
  static processDeposit(
    wallet: Wallet,
    amount: number,
    transactionHash: string
  ): Transaction {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId: wallet.userId,
      walletId: wallet.id,
      type: 'deposit',
      amount,
      currency: wallet.currency,
      status: 'completed',
      fee: 0,
      feeCurrency: wallet.currency,
      description: `Deposit from ${transactionHash.substring(0, 10)}...`,
      createdAt: Date.now(),
      completedAt: Date.now(),
    };

    wallet.balance += amount;
    wallet.availableBalance += amount;
    wallet.updatedAt = Date.now();

    return transaction;
  }

  /**
   * Process Withdrawal
   */
  static processWithdrawal(
    wallet: Wallet,
    amount: number,
    fee: number
  ): Transaction {
    if (wallet.availableBalance < amount + fee) {
      throw new Error('Insufficient balance for withdrawal');
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId: wallet.userId,
      walletId: wallet.id,
      type: 'withdrawal',
      amount,
      currency: wallet.currency,
      status: 'completed',
      fee,
      feeCurrency: wallet.currency,
      description: `Withdrawal of ${amount} ${wallet.currency}`,
      createdAt: Date.now(),
      completedAt: Date.now(),
    };

    wallet.balance -= amount + fee;
    wallet.availableBalance -= amount + fee;
    wallet.updatedAt = Date.now();

    return transaction;
  }

  /**
   * Transfer Between Wallets
   */
  static transferBetweenWallets(
    fromWallet: Wallet,
    toWallet: Wallet,
    amount: number
  ): { fromTransaction: Transaction; toTransaction: Transaction } {
    if (fromWallet.availableBalance < amount) {
      throw new Error('Insufficient balance in source wallet');
    }

    const fee = amount * 0.001;

    const fromTransaction: Transaction = {
      id: crypto.randomUUID(),
      userId: fromWallet.userId,
      walletId: fromWallet.id,
      type: 'transfer',
      amount,
      currency: fromWallet.currency,
      status: 'completed',
      fee,
      feeCurrency: fromWallet.currency,
      description: `Transfer to ${toWallet.currency} wallet`,
      createdAt: Date.now(),
      completedAt: Date.now(),
    };

    const toTransaction: Transaction = {
      id: crypto.randomUUID(),
      userId: toWallet.userId,
      walletId: toWallet.id,
      type: 'transfer',
      amount: amount - fee,
      currency: toWallet.currency,
      status: 'completed',
      fee: 0,
      feeCurrency: toWallet.currency,
      description: `Transfer from ${fromWallet.currency} wallet`,
      createdAt: Date.now(),
      completedAt: Date.now(),
    };

    fromWallet.balance -= amount + fee;
    fromWallet.availableBalance -= amount + fee;
    fromWallet.updatedAt = Date.now();

    toWallet.balance += amount - fee;
    toWallet.availableBalance += amount - fee;
    toWallet.updatedAt = Date.now();

    return { fromTransaction, toTransaction };
  }

  /**
   * Get Portfolio Summary
   */
  static getPortfolioSummary(wallets: Wallet[], recentTransactions: Transaction[]): PortfolioSummary {
    let totalBalance = 0;
    let totalBalanceInUSD = 0;

    const topAssets = wallets
      .filter((w) => w.balance > 0)
      .map((w) => {
        totalBalance += w.balance;
        totalBalanceInUSD += w.balanceInUSD;

        return {
          currency: w.currency,
          balance: w.balance,
          percentage: 0,
          balanceInUSD: w.balanceInUSD,
        };
      })
      .sort((a, b) => b.balanceInUSD - a.balanceInUSD);

    for (const asset of topAssets) {
      asset.percentage = totalBalanceInUSD > 0 ? (asset.balanceInUSD / totalBalanceInUSD) * 100 : 0;
    }

    return {
      totalBalance,
      totalBalanceInUSD,
      wallets,
      topAssets,
      recentTransactions: recentTransactions.slice(-10),
    };
  }

  /**
   * Calculate Asset Allocation
   */
  static calculateAssetAllocation(wallets: Wallet[]): Array<{
    currency: string;
    percentage: number;
    value: number;
  }> {
    const totalValue = wallets.reduce((sum, w) => sum + w.balanceInUSD, 0);

    return wallets
      .filter((w) => w.balance > 0)
      .map((w) => ({
        currency: w.currency,
        percentage: totalValue > 0 ? (w.balanceInUSD / totalValue) * 100 : 0,
        value: w.balanceInUSD,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Calculate Portfolio Performance
   */
  static calculatePortfolioPerformance(
    wallets: Wallet[],
    transactions: Transaction[],
    currentPrices: { [key: string]: number }
  ): {
    totalInvested: number;
    totalCurrent: number;
    totalPnL: number;
    totalPnLPercentage: number;
  } {
    let totalInvested = 0;
    let totalCurrent = 0;

    for (const transaction of transactions) {
      if (transaction.type === 'deposit' || transaction.type === 'trade') {
        totalInvested += transaction.amount;
      }
    }

    for (const wallet of wallets) {
      const currentPrice = currentPrices[wallet.currency] || 0;
      totalCurrent += wallet.balance * currentPrice;
    }

    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalPnL,
      totalPnLPercentage,
    };
  }

  /**
   * Lock Funds for Trading
   */
  static lockFundsForTrading(wallet: Wallet, amount: number): Wallet {
    return this.updateWalletBalance(wallet, amount, 'lock');
  }

  /**
   * Unlock Funds from Trading
   */
  static unlockFundsFromTrading(wallet: Wallet, amount: number): Wallet {
    return this.updateWalletBalance(wallet, amount, 'unlock');
  }

  /**
   * Calculate Total Balance in USD
   */
  static calculateTotalBalanceInUSD(wallets: Wallet[]): number {
    return wallets.reduce((sum, w) => sum + w.balanceInUSD, 0);
  }

  /**
   * Get Wallet by Currency
   */
  static getWalletByCurrency(wallets: Wallet[], currency: string): Wallet | undefined {
    return wallets.find((w) => w.currency === currency && w.status === 'active');
  }

  /**
   * Validate Deposit Address
   */
  static validateDepositAddress(address: string, currency: string): boolean {
    const patterns: { [key: string]: RegExp } = {
      BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
      ETH: /^0x[a-fA-F0-9]{40}$/,
      USDT: /^0x[a-fA-F0-9]{40}$/,
      BNB: /^bnb1[a-z0-9]{39}$/,
      XRP: /^r[a-zA-Z0-9]{24,34}$/,
    };

    const pattern = patterns[currency];
    return pattern ? pattern.test(address) : true;
  }

  /**
   * Get Staking Rewards
   */
  static calculateStakingRewards(
    wallet: Wallet,
    stakingRate: number,
    daysStaked: number
  ): number {
    return (wallet.balance * stakingRate * daysStaked) / 365 / 100;
  }

  /**
   * Get Savings Interest
   */
  static calculateSavingsInterest(
    wallet: Wallet,
    interestRate: number,
    daysHeld: number
  ): number {
    return (wallet.balance * interestRate * daysHeld) / 365 / 100;
  }
}

export default AssetManagementService;
