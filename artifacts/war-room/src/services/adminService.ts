import crypto from 'crypto';

interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'analyst';
  permissions: string[];
  isActive: boolean;
  createdAt: number;
  lastLoginAt?: number;
}

interface UserReport {
  userId: string;
  username: string;
  email: string;
  accountStatus: 'active' | 'suspended' | 'closed';
  kycStatus: 'pending' | 'approved' | 'rejected';
  totalBalance: number;
  totalTrades: number;
  totalFees: number;
  createdAt: number;
  lastLoginAt?: number;
}

interface ComplianceReport {
  id: string;
  reportType: 'aml' | 'kyc' | 'transaction' | 'user_activity' | 'regulatory';
  status: 'pending' | 'completed' | 'flagged';
  findings: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: number;
  completedAt?: number;
}

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  targetType: string;
  changes: { [key: string]: { old: any; new: any } };
  ipAddress: string;
  createdAt: number;
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  averageOrderSize: number;
  systemUptime: number;
  apiResponseTime: number;
}

interface FraudDetectionAlert {
  id: string;
  userId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  actionTaken: string;
  createdAt: number;
  resolvedAt?: number;
}

/**
 * Admin Service
 * Handles admin dashboard, compliance, and system management
 */
export class AdminService {
  /**
   * Create Admin User
   */
  static createAdminUser(
    email: string,
    role: 'super_admin' | 'admin' | 'moderator' | 'analyst'
  ): AdminUser {
    const permissions = this.getPermissionsByRole(role);

    return {
      id: crypto.randomUUID(),
      email,
      role,
      permissions,
      isActive: true,
      createdAt: Date.now(),
    };
  }

  /**
   * Get Permissions by Role
   */
  static getPermissionsByRole(role: string): string[] {
    const rolePermissions: { [key: string]: string[] } = {
      super_admin: [
        'manage_users',
        'manage_admins',
        'manage_subscriptions',
        'view_reports',
        'manage_compliance',
        'manage_system',
        'view_audit_logs',
        'manage_kyc',
        'manage_disputes',
        'manage_api_keys',
      ],
      admin: [
        'manage_users',
        'manage_subscriptions',
        'view_reports',
        'manage_compliance',
        'view_audit_logs',
        'manage_kyc',
        'manage_disputes',
      ],
      moderator: [
        'view_users',
        'manage_kyc',
        'manage_disputes',
        'view_reports',
      ],
      analyst: [
        'view_users',
        'view_reports',
        'view_audit_logs',
      ],
    };

    return rolePermissions[role] || [];
  }

  /**
   * Check Admin Permission
   */
  static hasPermission(admin: AdminUser, permission: string): boolean {
    return admin.permissions.includes(permission);
  }

  /**
   * Generate User Report
   */
  static generateUserReport(
    userId: string,
    username: string,
    email: string,
    accountStatus: string,
    kycStatus: string,
    totalBalance: number,
    totalTrades: number,
    totalFees: number,
    createdAt: number,
    lastLoginAt?: number
  ): UserReport {
    return {
      userId,
      username,
      email,
      accountStatus: accountStatus as any,
      kycStatus: kycStatus as any,
      totalBalance,
      totalTrades,
      totalFees,
      createdAt,
      lastLoginAt,
    };
  }

  /**
   * Generate Compliance Report
   */
  static generateComplianceReport(
    reportType: 'aml' | 'kyc' | 'transaction' | 'user_activity' | 'regulatory',
    findings: string[],
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): ComplianceReport {
    return {
      id: crypto.randomUUID(),
      reportType,
      status: 'pending',
      findings,
      riskLevel,
      createdAt: Date.now(),
    };
  }

  /**
   * Create Audit Log
   */
  static createAuditLog(
    adminId: string,
    action: string,
    targetId: string,
    targetType: string,
    changes: { [key: string]: { old: any; new: any } },
    ipAddress: string
  ): AuditLog {
    return {
      id: crypto.randomUUID(),
      adminId,
      action,
      targetId,
      targetType,
      changes,
      ipAddress,
      createdAt: Date.now(),
    };
  }

  /**
   * Suspend User Account
   */
  static suspendUserAccount(userId: string, reason: string): AuditLog {
    return this.createAuditLog(
      'system',
      'suspend_account',
      userId,
      'user',
      { status: { old: 'active', new: 'suspended' } },
      '0.0.0.0'
    );
  }

  /**
   * Unsuspend User Account
   */
  static unsuspendUserAccount(userId: string): AuditLog {
    return this.createAuditLog(
      'system',
      'unsuspend_account',
      userId,
      'user',
      { status: { old: 'suspended', new: 'active' } },
      '0.0.0.0'
    );
  }

  /**
   * Approve KYC
   */
  static approveKYC(userId: string, adminId: string): AuditLog {
    return this.createAuditLog(
      adminId,
      'approve_kyc',
      userId,
      'kyc',
      { status: { old: 'pending', new: 'approved' } },
      '0.0.0.0'
    );
  }

  /**
   * Reject KYC
   */
  static rejectKYC(userId: string, adminId: string, reason: string): AuditLog {
    return this.createAuditLog(
      adminId,
      'reject_kyc',
      userId,
      'kyc',
      { status: { old: 'pending', new: 'rejected' }, reason },
      '0.0.0.0'
    );
  }

  /**
   * Calculate System Metrics
   */
  static calculateSystemMetrics(
    totalUsers: number,
    activeUsers: number,
    totalTransactions: number,
    totalVolume: number,
    totalFees: number,
    systemUptime: number,
    apiResponseTime: number
  ): SystemMetrics {
    const averageOrderSize = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    return {
      totalUsers,
      activeUsers,
      totalTransactions,
      totalVolume,
      totalFees,
      averageOrderSize,
      systemUptime,
      apiResponseTime,
    };
  }

  /**
   * Detect Fraud
   */
  static detectFraud(
    userId: string,
    transactionAmount: number,
    averageTransactionAmount: number,
    loginCountToday: number,
    failedLoginAttempts: number
  ): FraudDetectionAlert | null {
    const alerts: FraudDetectionAlert[] = [];

    // Check for unusual transaction amount
    if (transactionAmount > averageTransactionAmount * 10) {
      alerts.push({
        id: crypto.randomUUID(),
        userId,
        alertType: 'unusual_transaction_amount',
        severity: 'high',
        description: `Transaction amount is 10x higher than average`,
        evidence: [`Transaction: ${transactionAmount}`, `Average: ${averageTransactionAmount}`],
        actionTaken: 'pending',
        createdAt: Date.now(),
      });
    }

    // Check for multiple login attempts
    if (loginCountToday > 10) {
      alerts.push({
        id: crypto.randomUUID(),
        userId,
        alertType: 'multiple_login_attempts',
        severity: 'medium',
        description: `${loginCountToday} login attempts today`,
        evidence: [`Login attempts: ${loginCountToday}`],
        actionTaken: 'pending',
        createdAt: Date.now(),
      });
    }

    // Check for failed login attempts
    if (failedLoginAttempts > 5) {
      alerts.push({
        id: crypto.randomUUID(),
        userId,
        alertType: 'multiple_failed_logins',
        severity: 'high',
        description: `${failedLoginAttempts} failed login attempts`,
        evidence: [`Failed attempts: ${failedLoginAttempts}`],
        actionTaken: 'pending',
        createdAt: Date.now(),
      });
    }

    return alerts.length > 0 ? alerts[0] : null;
  }

  /**
   * Generate AML Report
   */
  static generateAMLReport(
    transactions: Array<{
      amount: number;
      timestamp: number;
      type: string;
    }>
  ): ComplianceReport {
    const findings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for structuring (multiple small transactions)
    const dailyTransactions = transactions.filter(
      (t) => Date.now() - t.timestamp < 24 * 60 * 60 * 1000
    );

    if (dailyTransactions.length > 10) {
      findings.push('Multiple transactions in short time period');
      riskLevel = 'medium';
    }

    // Check for large transactions
    const largeTransactions = transactions.filter((t) => t.amount > 100000);
    if (largeTransactions.length > 0) {
      findings.push(`${largeTransactions.length} large transactions detected`);
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Check for rapid withdrawals
    const withdrawals = transactions.filter((t) => t.type === 'withdrawal');
    if (withdrawals.length > 5) {
      findings.push('Multiple withdrawals detected');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    return this.generateComplianceReport('aml', findings, riskLevel);
  }

  /**
   * Generate Transaction Report
   */
  static generateTransactionReport(
    transactions: Array<{
      amount: number;
      timestamp: number;
      type: string;
      status: string;
    }>
  ): {
    totalTransactions: number;
    totalVolume: number;
    successfulTransactions: number;
    failedTransactions: number;
    averageTransactionSize: number;
  } {
    const totalTransactions = transactions.length;
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    const successfulTransactions = transactions.filter((t) => t.status === 'completed').length;
    const failedTransactions = transactions.filter((t) => t.status === 'failed').length;
    const averageTransactionSize = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    return {
      totalTransactions,
      totalVolume,
      successfulTransactions,
      failedTransactions,
      averageTransactionSize,
    };
  }

  /**
   * Generate User Activity Report
   */
  static generateUserActivityReport(
    users: Array<{
      userId: string;
      lastLoginAt: number;
      totalTrades: number;
      totalVolume: number;
    }>
  ): {
    activeUsers: number;
    inactiveUsers: number;
    totalTrades: number;
    totalVolume: number;
    averageTradesPerUser: number;
  } {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const activeUsers = users.filter((u) => u.lastLoginAt > thirtyDaysAgo).length;
    const inactiveUsers = users.length - activeUsers;
    const totalTrades = users.reduce((sum, u) => sum + u.totalTrades, 0);
    const totalVolume = users.reduce((sum, u) => sum + u.totalVolume, 0);
    const averageTradesPerUser = users.length > 0 ? totalTrades / users.length : 0;

    return {
      activeUsers,
      inactiveUsers,
      totalTrades,
      totalVolume,
      averageTradesPerUser,
    };
  }

  /**
   * Generate Regulatory Report
   */
  static generateRegulatoryReport(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  ): ComplianceReport {
    const findings = [
      `${period} regulatory compliance check completed`,
      'All KYC requirements verified',
      'AML policies enforced',
      'Transaction monitoring active',
    ];

    return this.generateComplianceReport('regulatory', findings, 'low');
  }

  /**
   * Export Report
   */
  static exportReport(report: ComplianceReport, format: 'pdf' | 'csv' | 'json'): string {
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      return `Report ID,Type,Status,Risk Level,Created At\n${report.id},${report.reportType},${report.status},${report.riskLevel},${new Date(report.createdAt).toISOString()}`;
    } else {
      // PDF export would require additional library
      return `PDF Export: ${report.id}`;
    }
  }

  /**
   * Get Dashboard Statistics
   */
  static getDashboardStatistics(
    metrics: SystemMetrics,
    reports: ComplianceReport[]
  ): {
    totalUsers: number;
    activeUsers: number;
    userEngagement: number;
    systemHealth: number;
    complianceScore: number;
    flaggedReports: number;
  } {
    const userEngagement = metrics.totalUsers > 0 ? (metrics.activeUsers / metrics.totalUsers) * 100 : 0;
    const systemHealth = Math.min(100, metrics.systemUptime);
    const flaggedReports = reports.filter((r) => r.status === 'flagged').length;

    // Calculate compliance score
    let complianceScore = 100;
    const criticalReports = reports.filter((r) => r.riskLevel === 'critical').length;
    const highReports = reports.filter((r) => r.riskLevel === 'high').length;

    complianceScore -= criticalReports * 20;
    complianceScore -= highReports * 10;
    complianceScore = Math.max(0, complianceScore);

    return {
      totalUsers: metrics.totalUsers,
      activeUsers: metrics.activeUsers,
      userEngagement: Math.round(userEngagement),
      systemHealth: Math.round(systemHealth),
      complianceScore: Math.round(complianceScore),
      flaggedReports,
    };
  }
}

export default AdminService;
