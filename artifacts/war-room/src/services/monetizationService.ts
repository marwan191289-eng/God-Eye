import crypto from 'crypto';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'basic' | 'pro' | 'premium' | 'enterprise';
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    maxApiKeys: number;
    maxGridBots: number;
    maxCopyTradingFollows: number;
    apiRateLimit: number;
  };
  advancedFeatures: {
    advancedAnalytics: boolean;
    aiSignals: boolean;
    copyTrading: boolean;
    gridBot: boolean;
    marginTrading: boolean;
    futuresTrading: boolean;
  };
}

interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  tier: string;
  status: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'expired';
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  autoRenew: boolean;
  cancelledAt?: number;
  createdAt: number;
  updatedAt: number;
}

interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transactionId: string;
  createdAt: number;
  completedAt?: number;
}

interface ReferralProgram {
  id: string;
  userId: string;
  referralCode: string;
  commissionPercentage: number;
  totalEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  isActive: boolean;
  createdAt: number;
}

interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  rewardAmount: number;
  status: 'pending' | 'active' | 'inactive';
  createdAt: number;
}

/**
 * Monetization Service
 * Handles subscriptions, payments, referrals, and affiliate programs
 */
export class MonetizationService {
  private static readonly DEFAULT_PLANS: SubscriptionPlan[] = [
    {
      id: crypto.randomUUID(),
      name: 'Free',
      tier: 'free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: ['Basic trading', 'Limited signals', 'Community support'],
      limits: {
        maxApiKeys: 1,
        maxGridBots: 1,
        maxCopyTradingFollows: 0,
        apiRateLimit: 100,
      },
      advancedFeatures: {
        advancedAnalytics: false,
        aiSignals: false,
        copyTrading: false,
        gridBot: false,
        marginTrading: false,
        futuresTrading: false,
      },
    },
    {
      id: crypto.randomUUID(),
      name: 'Basic',
      tier: 'basic',
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      features: ['Spot trading', 'Basic signals', 'Email support', '1 API key'],
      limits: {
        maxApiKeys: 5,
        maxGridBots: 5,
        maxCopyTradingFollows: 0,
        apiRateLimit: 1200,
      },
      advancedFeatures: {
        advancedAnalytics: false,
        aiSignals: false,
        copyTrading: false,
        gridBot: true,
        marginTrading: false,
        futuresTrading: false,
      },
    },
    {
      id: crypto.randomUUID(),
      name: 'Pro',
      tier: 'pro',
      monthlyPrice: 29.99,
      annualPrice: 299.99,
      features: [
        'Spot & Margin trading',
        'Advanced signals',
        'Priority support',
        'Copy trading',
        'Advanced analytics',
      ],
      limits: {
        maxApiKeys: 20,
        maxGridBots: 20,
        maxCopyTradingFollows: 10,
        apiRateLimit: 6000,
      },
      advancedFeatures: {
        advancedAnalytics: true,
        aiSignals: true,
        copyTrading: true,
        gridBot: true,
        marginTrading: true,
        futuresTrading: false,
      },
    },
    {
      id: crypto.randomUUID(),
      name: 'Premium',
      tier: 'premium',
      monthlyPrice: 99.99,
      annualPrice: 999.99,
      features: [
        'All Pro features',
        'Futures trading',
        'Dedicated account manager',
        'Custom alerts',
        'API webhooks',
      ],
      limits: {
        maxApiKeys: 50,
        maxGridBots: 50,
        maxCopyTradingFollows: 50,
        apiRateLimit: 12000,
      },
      advancedFeatures: {
        advancedAnalytics: true,
        aiSignals: true,
        copyTrading: true,
        gridBot: true,
        marginTrading: true,
        futuresTrading: true,
      },
    },
  ];

  /**
   * Get Subscription Plans
   */
  static getSubscriptionPlans(): SubscriptionPlan[] {
    return this.DEFAULT_PLANS;
  }

  /**
   * Get Plan by Tier
   */
  static getPlanByTier(tier: string): SubscriptionPlan | undefined {
    return this.DEFAULT_PLANS.find((p) => p.tier === tier);
  }

  /**
   * Create Subscription
   */
  static createSubscription(
    userId: string,
    planId: string,
    billingCycle: 'monthly' | 'annual'
  ): UserSubscription {
    const plan = this.DEFAULT_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const now = Date.now();
    const periodEnd = billingCycle === 'monthly' ? now + 30 * 24 * 60 * 60 * 1000 : now + 365 * 24 * 60 * 60 * 1000;

    return {
      id: crypto.randomUUID(),
      userId,
      planId,
      tier: plan.tier,
      status: 'active',
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      autoRenew: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Upgrade Subscription
   */
  static upgradeSubscription(
    subscription: UserSubscription,
    newPlanId: string
  ): UserSubscription {
    const newPlan = this.DEFAULT_PLANS.find((p) => p.id === newPlanId);
    if (!newPlan) {
      throw new Error('Plan not found');
    }

    subscription.planId = newPlanId;
    subscription.tier = newPlan.tier;
    subscription.updatedAt = Date.now();

    return subscription;
  }

  /**
   * Cancel Subscription
   */
  static cancelSubscription(subscription: UserSubscription): UserSubscription {
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    subscription.cancelledAt = Date.now();
    subscription.updatedAt = Date.now();

    return subscription;
  }

  /**
   * Process Payment
   */
  static processPayment(
    userId: string,
    subscriptionId: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ): Payment {
    return {
      id: crypto.randomUUID(),
      userId,
      subscriptionId,
      amount,
      currency,
      paymentMethod,
      status: 'completed',
      transactionId: crypto.randomUUID(),
      createdAt: Date.now(),
      completedAt: Date.now(),
    };
  }

  /**
   * Create Referral Program
   */
  static createReferralProgram(userId: string): ReferralProgram {
    return {
      id: crypto.randomUUID(),
      userId,
      referralCode: this.generateReferralCode(),
      commissionPercentage: 20, // 20% commission
      totalEarnings: 0,
      totalReferrals: 0,
      activeReferrals: 0,
      isActive: true,
      createdAt: Date.now(),
    };
  }

  /**
   * Generate Referral Code
   */
  static generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create Referral
   */
  static createReferral(
    referrerId: string,
    refereeId: string,
    referralCode: string
  ): Referral {
    return {
      id: crypto.randomUUID(),
      referrerId,
      refereeId,
      referralCode,
      rewardAmount: 0,
      status: 'pending',
      createdAt: Date.now(),
    };
  }

  /**
   * Activate Referral
   */
  static activateReferral(referral: Referral, program: ReferralProgram): Referral {
    referral.status = 'active';
    program.activeReferrals++;
    program.totalReferrals++;

    return referral;
  }

  /**
   * Calculate Referral Commission
   */
  static calculateReferralCommission(
    referralAmount: number,
    commissionPercentage: number
  ): number {
    return (referralAmount * commissionPercentage) / 100;
  }

  /**
   * Calculate Subscription Cost
   */
  static calculateSubscriptionCost(
    plan: SubscriptionPlan,
    billingCycle: 'monthly' | 'annual'
  ): number {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  }

  /**
   * Calculate Annual Savings
   */
  static calculateAnnualSavings(plan: SubscriptionPlan): number {
    const monthlyTotal = plan.monthlyPrice * 12;
    const annualPrice = plan.annualPrice;

    return monthlyTotal - annualPrice;
  }

  /**
   * Get Subscription Features
   */
  static getSubscriptionFeatures(subscription: UserSubscription): string[] {
    const plan = this.DEFAULT_PLANS.find((p) => p.id === subscription.planId);
    return plan ? plan.features : [];
  }

  /**
   * Check Feature Access
   */
  static hasFeatureAccess(
    subscription: UserSubscription,
    feature: string
  ): boolean {
    const plan = this.DEFAULT_PLANS.find((p) => p.id === subscription.planId);
    if (!plan) return false;

    const featureMap: { [key: string]: keyof typeof plan.advancedFeatures } = {
      advancedAnalytics: 'advancedAnalytics',
      aiSignals: 'aiSignals',
      copyTrading: 'copyTrading',
      gridBot: 'gridBot',
      marginTrading: 'marginTrading',
      futuresTrading: 'futuresTrading',
    };

    const featureKey = featureMap[feature];
    return featureKey ? plan.advancedFeatures[featureKey] : false;
  }

  /**
   * Get Subscription Limits
   */
  static getSubscriptionLimits(subscription: UserSubscription): SubscriptionPlan['limits'] {
    const plan = this.DEFAULT_PLANS.find((p) => p.id === subscription.planId);
    return plan ? plan.limits : this.DEFAULT_PLANS[0].limits;
  }

  /**
   * Check Subscription Status
   */
  static isSubscriptionActive(subscription: UserSubscription): boolean {
    return (
      subscription.status === 'active' &&
      subscription.currentPeriodEnd > Date.now()
    );
  }

  /**
   * Get Days Until Renewal
   */
  static getDaysUntilRenewal(subscription: UserSubscription): number {
    const daysMs = subscription.currentPeriodEnd - Date.now();
    return Math.ceil(daysMs / (24 * 60 * 60 * 1000));
  }

  /**
   * Generate Invoice
   */
  static generateInvoice(
    payment: Payment,
    subscription: UserSubscription
  ): string {
    const plan = this.DEFAULT_PLANS.find((p) => p.id === subscription.planId);
    const date = new Date(payment.createdAt).toISOString().split('T')[0];

    return `
INVOICE
=======
Invoice ID: ${payment.id}
Date: ${date}
Amount: ${payment.amount} ${payment.currency}
Plan: ${plan?.name}
Billing Cycle: ${subscription.billingCycle}
Status: ${payment.status}

Thank you for your subscription!
    `.trim();
  }

  /**
   * Calculate Lifetime Value
   */
  static calculateLifetimeValue(
    subscription: UserSubscription,
    monthsActive: number
  ): number {
    const plan = this.DEFAULT_PLANS.find((p) => p.id === subscription.planId);
    if (!plan) return 0;

    const monthlyPrice = plan.monthlyPrice;
    return monthlyPrice * monthsActive;
  }

  /**
   * Get Revenue Metrics
   */
  static getRevenueMetrics(
    subscriptions: UserSubscription[],
    payments: Payment[]
  ): {
    totalRevenue: number;
    activeSubscriptions: number;
    churnRate: number;
    averageRevenue: number;
  } {
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const activeSubscriptions = subscriptions.filter((s) => this.isSubscriptionActive(s)).length;
    const cancelledSubscriptions = subscriptions.filter((s) => s.status === 'cancelled').length;
    const churnRate = subscriptions.length > 0 ? (cancelledSubscriptions / subscriptions.length) * 100 : 0;
    const averageRevenue = subscriptions.length > 0 ? totalRevenue / subscriptions.length : 0;

    return {
      totalRevenue,
      activeSubscriptions,
      churnRate,
      averageRevenue,
    };
  }
}

export default MonetizationService;
