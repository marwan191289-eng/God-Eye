import { v4 as uuidv4 } from 'uuid';

export interface DeveloperAccount {
  id: string;
  adminId: string;
  name: string;
  email: string;
  internalWalletId: string;
  externalWallets: string[]; // Connected wallet addresses
  isActive: boolean;
  privileges: DeveloperPrivilege[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeveloperPrivilege {
  id: string;
  type: 'zero_fees' | 'unlimited_trading' | 'no_limits' | 'instant_settlement' | 'api_access' | 'data_export';
  isActive: boolean;
  description: string;
  grantedAt: Date;
}

export interface DeveloperTrade {
  id: string;
  developerId: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalValue: number;
  fee: number; // Should always be 0 for developer
  platformFee: number; // Should always be 0 for developer
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: Date;
  executedAt?: Date;
}

export interface DeveloperWallet {
  id: string;
  developerId: string;
  walletType: 'internal' | 'external';
  address: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

class DeveloperPrivilegesService {
  private developerAccounts: Map<string, DeveloperAccount> = new Map();
  private developerWallets: Map<string, DeveloperWallet> = new Map();
  private developerTrades: Map<string, DeveloperTrade> = new Map();

  /**
   * Create developer account
   */
  createDeveloperAccount(
    adminId: string,
    name: string,
    email: string
  ): DeveloperAccount {
    const developerId = uuidv4();
    const internalWalletId = uuidv4();

    // Create internal wallet for developer
    const internalWallet: DeveloperWallet = {
      id: internalWalletId,
      developerId,
      walletType: 'internal',
      address: `dev-wallet-${developerId.slice(0, 8)}`,
      balance: 0,
      availableBalance: 0,
      lockedBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.developerWallets.set(internalWalletId, internalWallet);

    // Create developer account with all privileges
    const developerAccount: DeveloperAccount = {
      id: developerId,
      adminId,
      name,
      email,
      internalWalletId,
      externalWallets: [],
      isActive: true,
      privileges: [
        {
          id: 'priv-zero-fees',
          type: 'zero_fees',
          isActive: true,
          description: 'Trade without any platform fees',
          grantedAt: new Date(),
        },
        {
          id: 'priv-unlimited-trading',
          type: 'unlimited_trading',
          isActive: true,
          description: 'Unlimited trading volume and frequency',
          grantedAt: new Date(),
        },
        {
          id: 'priv-no-limits',
          type: 'no_limits',
          isActive: true,
          description: 'No trading limits or restrictions',
          grantedAt: new Date(),
        },
        {
          id: 'priv-instant-settlement',
          type: 'instant_settlement',
          isActive: true,
          description: 'Instant settlement of trades',
          grantedAt: new Date(),
        },
        {
          id: 'priv-api-access',
          type: 'api_access',
          isActive: true,
          description: 'Full API access for programmatic trading',
          grantedAt: new Date(),
        },
        {
          id: 'priv-data-export',
          type: 'data_export',
          isActive: true,
          description: 'Export all platform data',
          grantedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.developerAccounts.set(developerId, developerAccount);
    return developerAccount;
  }

  /**
   * Get developer account
   */
  getDeveloperAccount(developerId: string): DeveloperAccount | null {
    return this.developerAccounts.get(developerId) || null;
  }

  /**
   * Check if developer has privilege
   */
  hasPrivilege(developerId: string, privilegeType: string): boolean {
    const account = this.developerAccounts.get(developerId);
    if (!account) return false;

    return account.privileges.some((p) => p.type === privilegeType && p.isActive);
  }

  /**
   * Connect external wallet to developer account
   */
  connectExternalWallet(developerId: string, walletAddress: string): DeveloperWallet {
    const account = this.developerAccounts.get(developerId);
    if (!account) throw new Error('Developer account not found');

    // Check if wallet already connected
    if (account.externalWallets.includes(walletAddress)) {
      throw new Error('Wallet already connected');
    }

    const walletId = uuidv4();
    const wallet: DeveloperWallet = {
      id: walletId,
      developerId,
      walletType: 'external',
      address: walletAddress,
      balance: 0,
      availableBalance: 0,
      lockedBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.developerWallets.set(walletId, wallet);
    account.externalWallets.push(walletAddress);
    account.updatedAt = new Date();

    return wallet;
  }

  /**
   * Get developer wallets
   */
  getDeveloperWallets(developerId: string): DeveloperWallet[] {
    return Array.from(this.developerWallets.values()).filter((w) => w.developerId === developerId);
  }

  /**
   * Get developer wallet by ID
   */
  getWallet(walletId: string): DeveloperWallet | null {
    return this.developerWallets.get(walletId) || null;
  }

  /**
   * Execute developer trade (zero fees)
   */
  executeDeveloperTrade(
    developerId: string,
    symbol: string,
    type: 'buy' | 'sell',
    quantity: number,
    price: number
  ): DeveloperTrade {
    const account = this.developerAccounts.get(developerId);
    if (!account) throw new Error('Developer account not found');

    // Check zero fees privilege
    if (!this.hasPrivilege(developerId, 'zero_fees')) {
      throw new Error('Developer does not have zero fees privilege');
    }

    const tradeId = uuidv4();
    const totalValue = quantity * price;

    const trade: DeveloperTrade = {
      id: tradeId,
      developerId,
      symbol,
      type,
      quantity,
      price,
      totalValue,
      fee: 0, // Always zero for developer
      platformFee: 0, // Always zero for developer
      status: 'pending',
      timestamp: new Date(),
    };

    this.developerTrades.set(tradeId, trade);

    // Simulate instant execution
    setTimeout(() => {
      trade.status = 'filled';
      trade.executedAt = new Date();
    }, 500);

    return trade;
  }

  /**
   * Get developer trades
   */
  getDeveloperTrades(developerId: string, limit: number = 100): DeveloperTrade[] {
    return Array.from(this.developerTrades.values())
      .filter((t) => t.developerId === developerId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Deposit to developer wallet
   */
  depositToDeveloperWallet(walletId: string, amount: number): void {
    const wallet = this.developerWallets.get(walletId);
    if (!wallet) throw new Error('Wallet not found');

    wallet.balance += amount;
    wallet.availableBalance += amount;
    wallet.updatedAt = new Date();
  }

  /**
   * Withdraw from developer wallet
   */
  withdrawFromDeveloperWallet(walletId: string, amount: number): void {
    const wallet = this.developerWallets.get(walletId);
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.availableBalance < amount) throw new Error('Insufficient balance');

    wallet.balance -= amount;
    wallet.availableBalance -= amount;
    wallet.updatedAt = new Date();
  }

  /**
   * Get developer statistics
   */
  getDeveloperStats(developerId: string) {
    const account = this.developerAccounts.get(developerId);
    if (!account) return null;

    const trades = this.getDeveloperTrades(developerId);
    const wallets = this.getDeveloperWallets(developerId);
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalVolume = trades.reduce((sum, t) => sum + t.totalValue, 0);

    return {
      account,
      totalTrades: trades.length,
      totalVolume,
      totalWallets: wallets.length,
      totalBalance,
      activePrivileges: account.privileges.filter((p) => p.isActive).length,
      trades: trades.slice(0, 10),
      wallets,
    };
  }

  /**
   * Grant additional privilege
   */
  grantPrivilege(developerId: string, privilegeType: string): DeveloperAccount | null {
    const account = this.developerAccounts.get(developerId);
    if (!account) return null;

    const existingPrivilege = account.privileges.find((p) => p.type === privilegeType);
    if (existingPrivilege) {
      existingPrivilege.isActive = true;
    } else {
      account.privileges.push({
        id: `priv-${uuidv4()}`,
        type: privilegeType as any,
        isActive: true,
        description: `Developer privilege: ${privilegeType}`,
        grantedAt: new Date(),
      });
    }

    account.updatedAt = new Date();
    return account;
  }

  /**
   * Revoke privilege
   */
  revokePrivilege(developerId: string, privilegeType: string): DeveloperAccount | null {
    const account = this.developerAccounts.get(developerId);
    if (!account) return null;

    const privilege = account.privileges.find((p) => p.type === privilegeType);
    if (privilege) {
      privilege.isActive = false;
    }

    account.updatedAt = new Date();
    return account;
  }

  /**
   * Get all developer accounts
   */
  getAllDeveloperAccounts(): DeveloperAccount[] {
    return Array.from(this.developerAccounts.values());
  }

  /**
   * Get developer trading stats
   */
  getTradingStats(developerId: string) {
    const trades = this.getDeveloperTrades(developerId);
    const buyTrades = trades.filter((t) => t.type === 'buy');
    const sellTrades = trades.filter((t) => t.type === 'sell');

    return {
      totalTrades: trades.length,
      buyTrades: buyTrades.length,
      sellTrades: sellTrades.length,
      totalVolume: trades.reduce((sum, t) => sum + t.totalValue, 0),
      totalSavings: 0, // Always 0 because developer pays no fees
      averageTradeSize: trades.length > 0 ? trades.reduce((sum, t) => sum + t.totalValue, 0) / trades.length : 0,
      symbols: [...new Set(trades.map((t) => t.symbol))],
    };
  }
}

export const developerPrivilegesService = new DeveloperPrivilegesService();
