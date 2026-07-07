import crypto from 'crypto';

interface SecurityEvent {
  id: string;
  userId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  resolved: boolean;
}

interface ThreatAlert {
  id: string;
  userId: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendedAction: string;
  timestamp: number;
  acknowledged: boolean;
}

interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number;
  reasons: string[];
  recommendedAction: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highRiskEvents: number;
  averageResponseTime: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Security Monitoring Service
 * Handles threat detection, anomaly detection, and security event logging
 */
export class SecurityMonitoringService {
  private static readonly ANOMALY_THRESHOLD = 0.7;
  private static readonly CRITICAL_THRESHOLD = 0.9;

  /**
   * Detect Anomalous Login Behavior
   */
  static detectLoginAnomaly(
    currentLogin: {
      ipAddress: string;
      userAgent: string;
      timestamp: number;
      country: string;
      city: string;
    },
    loginHistory: Array<{
      ipAddress: string;
      userAgent: string;
      timestamp: number;
      country: string;
      city: string;
    }>
  ): AnomalyDetectionResult {
    const reasons: string[] = [];
    let anomalyScore = 0;

    if (loginHistory.length === 0) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        reasons: [],
        recommendedAction: 'none',
      };
    }

    const lastLogin = loginHistory[loginHistory.length - 1];
    const timeDiff = currentLogin.timestamp - lastLogin.timestamp;

    // Check 1: Impossible travel (different countries in short time)
    if (currentLogin.country !== lastLogin.country && timeDiff < 3600000) {
      // Less than 1 hour
      reasons.push('Impossible travel detected (different countries in short time)');
      anomalyScore += 0.4;
    }

    // Check 2: New device/browser
    if (currentLogin.userAgent !== lastLogin.userAgent) {
      reasons.push('Login from new device/browser detected');
      anomalyScore += 0.2;
    }

    // Check 3: New IP address
    if (currentLogin.ipAddress !== lastLogin.ipAddress) {
      reasons.push('Login from new IP address');
      anomalyScore += 0.15;
    }

    // Check 4: Unusual time of login
    const currentHour = new Date(currentLogin.timestamp).getHours();
    const lastHour = new Date(lastLogin.timestamp).getHours();
    if (Math.abs(currentHour - lastHour) > 12) {
      reasons.push('Login at unusual time');
      anomalyScore += 0.1;
    }

    // Check 5: Multiple failed attempts before success
    const recentFailedAttempts = loginHistory.filter(
      (log) => currentLogin.timestamp - log.timestamp < 1800000 // Last 30 minutes
    );
    if (recentFailedAttempts.length > 3) {
      reasons.push('Multiple failed login attempts detected');
      anomalyScore += 0.15;
    }

    const isAnomaly = anomalyScore >= this.ANOMALY_THRESHOLD;
    const recommendedAction = this.getRecommendedAction(anomalyScore, reasons);

    return {
      isAnomaly,
      anomalyScore: Math.min(1, anomalyScore),
      reasons,
      recommendedAction,
    };
  }

  /**
   * Detect Unusual Transaction Activity
   */
  static detectTransactionAnomaly(
    currentTransaction: {
      amount: number;
      currency: string;
      timestamp: number;
      address: string;
    },
    transactionHistory: Array<{
      amount: number;
      currency: string;
      timestamp: number;
      address: string;
    }>
  ): AnomalyDetectionResult {
    const reasons: string[] = [];
    let anomalyScore = 0;

    if (transactionHistory.length === 0) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        reasons: [],
        recommendedAction: 'none',
      };
    }

    // Calculate average transaction amount
    const avgAmount =
      transactionHistory.reduce((sum, tx) => sum + tx.amount, 0) / transactionHistory.length;
    const maxAmount = Math.max(...transactionHistory.map((tx) => tx.amount));

    // Check 1: Unusually large transaction
    if (currentTransaction.amount > avgAmount * 5) {
      reasons.push(`Transaction amount is 5x higher than average (avg: ${avgAmount})`);
      anomalyScore += 0.3;
    }

    if (currentTransaction.amount > maxAmount * 1.5) {
      reasons.push('Transaction amount exceeds historical maximum');
      anomalyScore += 0.2;
    }

    // Check 2: Withdrawal to new address
    const knownAddresses = new Set(transactionHistory.map((tx) => tx.address));
    if (!knownAddresses.has(currentTransaction.address)) {
      reasons.push('Withdrawal to new/unknown address');
      anomalyScore += 0.25;
    }

    // Check 3: Multiple transactions in short time
    const recentTransactions = transactionHistory.filter(
      (tx) => currentTransaction.timestamp - tx.timestamp < 600000 // Last 10 minutes
    );
    if (recentTransactions.length > 5) {
      reasons.push('Multiple transactions in short time period');
      anomalyScore += 0.2;
    }

    // Check 4: Rapid account balance depletion
    const totalRecentAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    if (totalRecentAmount > avgAmount * 20) {
      reasons.push('Rapid account balance depletion detected');
      anomalyScore += 0.3;
    }

    const isAnomaly = anomalyScore >= this.ANOMALY_THRESHOLD;
    const recommendedAction = this.getRecommendedAction(anomalyScore, reasons);

    return {
      isAnomaly,
      anomalyScore: Math.min(1, anomalyScore),
      reasons,
      recommendedAction,
    };
  }

  /**
   * Detect API Key Abuse
   */
  static detectAPIKeyAbuse(
    apiKeyUsage: {
      requestsPerMinute: number;
      requestsPerHour: number;
      failedRequests: number;
      uniqueIPs: number;
    },
    rateLimit: number = 1200
  ): AnomalyDetectionResult {
    const reasons: string[] = [];
    let anomalyScore = 0;

    // Check 1: Exceeding rate limit
    if (apiKeyUsage.requestsPerMinute > rateLimit / 60) {
      reasons.push('API requests exceeding rate limit');
      anomalyScore += 0.3;
    }

    // Check 2: High failure rate
    const failureRate = apiKeyUsage.failedRequests / (apiKeyUsage.requestsPerHour + 1);
    if (failureRate > 0.5) {
      reasons.push('High API request failure rate detected');
      anomalyScore += 0.2;
    }

    // Check 3: Requests from multiple IPs
    if (apiKeyUsage.uniqueIPs > 5) {
      reasons.push('API key used from multiple IP addresses');
      anomalyScore += 0.25;
    }

    // Check 4: Sudden spike in requests
    if (apiKeyUsage.requestsPerMinute > 100) {
      reasons.push('Sudden spike in API requests');
      anomalyScore += 0.15;
    }

    const isAnomaly = anomalyScore >= this.ANOMALY_THRESHOLD;
    const recommendedAction = this.getRecommendedAction(anomalyScore, reasons);

    return {
      isAnomaly,
      anomalyScore: Math.min(1, anomalyScore),
      reasons,
      recommendedAction,
    };
  }

  /**
   * Get Recommended Action Based on Anomaly Score
   */
  static getRecommendedAction(anomalyScore: number, reasons: string[]): string {
    if (anomalyScore >= this.CRITICAL_THRESHOLD) {
      return 'CRITICAL: Account locked. User must verify identity immediately.';
    } else if (anomalyScore >= 0.8) {
      return 'HIGH: Require 2FA verification. Monitor account closely.';
    } else if (anomalyScore >= this.ANOMALY_THRESHOLD) {
      return 'MEDIUM: Send security alert to user. Request verification if needed.';
    } else if (anomalyScore >= 0.5) {
      return 'LOW: Log event. Monitor for patterns.';
    }
    return 'No action required.';
  }

  /**
   * Create Security Event
   */
  static createSecurityEvent(
    userId: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    ipAddress: string,
    userAgent: string
  ): SecurityEvent {
    return {
      id: crypto.randomUUID(),
      userId,
      eventType,
      severity,
      description,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      resolved: false,
    };
  }

  /**
   * Create Threat Alert
   */
  static createThreatAlert(
    userId: string,
    threatType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    recommendedAction: string
  ): ThreatAlert {
    return {
      id: crypto.randomUUID(),
      userId,
      threatType,
      severity,
      description,
      recommendedAction,
      timestamp: Date.now(),
      acknowledged: false,
    };
  }

  /**
   * Detect Credential Stuffing Attack
   */
  static detectCredentialStuffing(
    failedLoginAttempts: Array<{
      email: string;
      ipAddress: string;
      timestamp: number;
    }>
  ): { isAttack: boolean; affectedAccounts: Set<string>; severity: string } {
    const recentAttempts = failedLoginAttempts.filter(
      (attempt) => Date.now() - attempt.timestamp < 3600000 // Last hour
    );

    const ipAttempts = new Map<string, number>();
    const affectedAccounts = new Set<string>();

    for (const attempt of recentAttempts) {
      ipAttempts.set(attempt.ipAddress, (ipAttempts.get(attempt.ipAddress) || 0) + 1);
      affectedAccounts.add(attempt.email);
    }

    // Check if single IP is trying many accounts
    let isAttack = false;
    let severity = 'low';

    for (const [ip, count] of ipAttempts.entries()) {
      if (count > 10) {
        isAttack = true;
        severity = count > 50 ? 'critical' : count > 20 ? 'high' : 'medium';
        break;
      }
    }

    return {
      isAttack,
      affectedAccounts,
      severity,
    };
  }

  /**
   * Detect DDoS Attack Pattern
   */
  static detectDDoSPattern(
    requests: Array<{
      ipAddress: string;
      timestamp: number;
      endpoint: string;
    }>
  ): { isDDoS: boolean; attackingIPs: string[]; severity: string } {
    const recentRequests = requests.filter(
      (req) => Date.now() - req.timestamp < 60000 // Last minute
    );

    const ipRequestCounts = new Map<string, number>();
    for (const req of recentRequests) {
      ipRequestCounts.set(req.ipAddress, (ipRequestCounts.get(req.ipAddress) || 0) + 1);
    }

    const attackingIPs: string[] = [];
    let isDDoS = false;
    let severity = 'low';

    for (const [ip, count] of ipRequestCounts.entries()) {
      if (count > 100) {
        attackingIPs.push(ip);
        isDDoS = true;
        severity = count > 1000 ? 'critical' : count > 500 ? 'high' : 'medium';
      }
    }

    return {
      isDDoS,
      attackingIPs,
      severity,
    };
  }

  /**
   * Calculate Security Metrics
   */
  static calculateSecurityMetrics(events: SecurityEvent[]): SecurityMetrics {
    const criticalEvents = events.filter((e) => e.severity === 'critical').length;
    const highRiskEvents = events.filter((e) => e.severity === 'high').length;

    const totalTime = events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : 0;
    const averageResponseTime = totalTime / Math.max(events.length, 1);

    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalEvents > 0) {
      threatLevel = 'critical';
    } else if (highRiskEvents > 5 || criticalEvents > 0) {
      threatLevel = 'high';
    } else if (highRiskEvents > 0) {
      threatLevel = 'medium';
    }

    return {
      totalEvents: events.length,
      criticalEvents,
      highRiskEvents,
      averageResponseTime,
      threatLevel,
    };
  }

  /**
   * Generate Security Report
   */
  static generateSecurityReport(
    userId: string,
    events: SecurityEvent[],
    alerts: ThreatAlert[]
  ): string {
    const metrics = this.calculateSecurityMetrics(events);
    const date = new Date().toISOString();

    const eventSummary = events
      .slice(-10) // Last 10 events
      .map((e) => `  [${new Date(e.timestamp).toISOString()}] ${e.severity.toUpperCase()}: ${e.eventType}`)
      .join('\n');

    const alertSummary = alerts
      .slice(-5) // Last 5 alerts
      .map((a) => `  [${new Date(a.timestamp).toISOString()}] ${a.severity.toUpperCase()}: ${a.threatType}`)
      .join('\n');

    return `
SECURITY REPORT
===============
User ID: ${userId}
Date: ${date}
Threat Level: ${metrics.threatLevel.toUpperCase()}

METRICS:
- Total Events: ${metrics.totalEvents}
- Critical Events: ${metrics.criticalEvents}
- High Risk Events: ${metrics.highRiskEvents}
- Average Response Time: ${metrics.averageResponseTime.toFixed(0)}ms

RECENT EVENTS:
${eventSummary || '  No events'}

ACTIVE ALERTS:
${alertSummary || '  No alerts'}

Report ID: ${crypto.randomUUID()}
    `.trim();
  }

  /**
   * Recommend Security Actions
   */
  static recommendSecurityActions(metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.threatLevel === 'critical') {
      recommendations.push('URGENT: Lock account and contact user immediately');
      recommendations.push('Review all recent login attempts and transactions');
      recommendations.push('Force password reset on next login');
    } else if (metrics.threatLevel === 'high') {
      recommendations.push('Enable additional security checks');
      recommendations.push('Require 2FA for next login');
      recommendations.push('Review recent account activity');
    } else if (metrics.threatLevel === 'medium') {
      recommendations.push('Monitor account activity closely');
      recommendations.push('Send security alert to user');
    }

    if (metrics.criticalEvents > 0) {
      recommendations.push('Investigate critical events immediately');
    }

    if (metrics.highRiskEvents > 10) {
      recommendations.push('Consider temporary account suspension');
    }

    return recommendations;
  }
}

export default SecurityMonitoringService;
