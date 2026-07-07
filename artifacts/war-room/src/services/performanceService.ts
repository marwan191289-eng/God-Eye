import crypto from 'crypto';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  threshold?: number;
}

interface PageLoadMetrics {
  url: string;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

interface UserSession {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  pageViews: number;
  actions: number;
  errors: number;
  sessionDuration: number;
}

interface ErrorLog {
  id: string;
  userId: string;
  errorType: string;
  message: string;
  stackTrace: string;
  url: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AnalyticsEvent {
  id: string;
  userId: string;
  eventName: string;
  eventCategory: string;
  eventValue?: number;
  properties: { [key: string]: any };
  timestamp: number;
}

/**
 * Performance Service
 * Handles performance monitoring, analytics, and optimization
 */
export class PerformanceService {
  /**
   * Measure Page Load Performance
   */
  static measurePageLoadPerformance(
    url: string,
    performanceData: any
  ): PageLoadMetrics {
    const navigationTiming = performanceData.timing;
    const paintEntries = performanceData.getEntriesByType('paint');

    return {
      url,
      domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart,
      loadComplete: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
      firstPaint: paintEntries.find((e: any) => e.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint:
        paintEntries.find((e: any) => e.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: 0, // Would be measured via PerformanceObserver
      cumulativeLayoutShift: 0, // Would be measured via PerformanceObserver
      timeToInteractive: navigationTiming.domInteractive - navigationTiming.navigationStart,
    };
  }

  /**
   * Create Performance Metric
   */
  static createPerformanceMetric(
    name: string,
    value: number,
    unit: string,
    threshold?: number
  ): PerformanceMetric {
    return {
      id: crypto.randomUUID(),
      name,
      value,
      unit,
      timestamp: Date.now(),
      threshold,
    };
  }

  /**
   * Check Performance Threshold
   */
  static checkPerformanceThreshold(metric: PerformanceMetric): boolean {
    if (!metric.threshold) {
      return true;
    }

    return metric.value <= metric.threshold;
  }

  /**
   * Create User Session
   */
  static createUserSession(userId: string): UserSession {
    return {
      id: crypto.randomUUID(),
      userId,
      startTime: Date.now(),
      pageViews: 0,
      actions: 0,
      errors: 0,
      sessionDuration: 0,
    };
  }

  /**
   * End User Session
   */
  static endUserSession(session: UserSession): UserSession {
    session.endTime = Date.now();
    session.sessionDuration = session.endTime - session.startTime;

    return session;
  }

  /**
   * Track Page View
   */
  static trackPageView(session: UserSession): UserSession {
    session.pageViews++;
    return session;
  }

  /**
   * Track User Action
   */
  static trackUserAction(session: UserSession): UserSession {
    session.actions++;
    return session;
  }

  /**
   * Track Error
   */
  static trackError(session: UserSession): UserSession {
    session.errors++;
    return session;
  }

  /**
   * Create Error Log
   */
  static createErrorLog(
    userId: string,
    errorType: string,
    message: string,
    stackTrace: string,
    url: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): ErrorLog {
    return {
      id: crypto.randomUUID(),
      userId,
      errorType,
      message,
      stackTrace,
      url,
      timestamp: Date.now(),
      severity,
    };
  }

  /**
   * Create Analytics Event
   */
  static createAnalyticsEvent(
    userId: string,
    eventName: string,
    eventCategory: string,
    properties: { [key: string]: any } = {},
    eventValue?: number
  ): AnalyticsEvent {
    return {
      id: crypto.randomUUID(),
      userId,
      eventName,
      eventCategory,
      eventValue,
      properties,
      timestamp: Date.now(),
    };
  }

  /**
   * Get Performance Report
   */
  static getPerformanceReport(
    metrics: PerformanceMetric[]
  ): {
    totalMetrics: number;
    passedMetrics: number;
    failedMetrics: number;
    averageValue: number;
    healthScore: number;
  } {
    const passedMetrics = metrics.filter((m) => this.checkPerformanceThreshold(m)).length;
    const failedMetrics = metrics.length - passedMetrics;
    const averageValue = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length : 0;
    const healthScore = metrics.length > 0 ? (passedMetrics / metrics.length) * 100 : 0;

    return {
      totalMetrics: metrics.length,
      passedMetrics,
      failedMetrics,
      averageValue,
      healthScore: Math.round(healthScore),
    };
  }

  /**
   * Get Session Analytics
   */
  static getSessionAnalytics(
    sessions: UserSession[]
  ): {
    totalSessions: number;
    totalPageViews: number;
    totalActions: number;
    totalErrors: number;
    averageSessionDuration: number;
    averagePageViewsPerSession: number;
  } {
    const totalSessions = sessions.length;
    const totalPageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0);
    const totalActions = sessions.reduce((sum, s) => sum + s.actions, 0);
    const totalErrors = sessions.reduce((sum, s) => sum + s.errors, 0);
    const averageSessionDuration =
      totalSessions > 0 ? sessions.reduce((sum, s) => sum + s.sessionDuration, 0) / totalSessions : 0;
    const averagePageViewsPerSession = totalSessions > 0 ? totalPageViews / totalSessions : 0;

    return {
      totalSessions,
      totalPageViews,
      totalActions,
      totalErrors,
      averageSessionDuration,
      averagePageViewsPerSession,
    };
  }

  /**
   * Get Error Analytics
   */
  static getErrorAnalytics(
    errors: ErrorLog[]
  ): {
    totalErrors: number;
    criticalErrors: number;
    highErrors: number;
    mediumErrors: number;
    lowErrors: number;
    errorRate: number;
  } {
    const totalErrors = errors.length;
    const criticalErrors = errors.filter((e) => e.severity === 'critical').length;
    const highErrors = errors.filter((e) => e.severity === 'high').length;
    const mediumErrors = errors.filter((e) => e.severity === 'medium').length;
    const lowErrors = errors.filter((e) => e.severity === 'low').length;
    const errorRate = totalErrors > 0 ? (criticalErrors + highErrors) / totalErrors : 0;

    return {
      totalErrors,
      criticalErrors,
      highErrors,
      mediumErrors,
      lowErrors,
      errorRate,
    };
  }

  /**
   * Get Event Analytics
   */
  static getEventAnalytics(
    events: AnalyticsEvent[]
  ): {
    [eventName: string]: {
      count: number;
      avgValue: number;
      lastOccurred: number;
    };
  } {
    const analytics: {
      [eventName: string]: {
        count: number;
        totalValue: number;
        lastOccurred: number;
      };
    } = {};

    for (const event of events) {
      if (!analytics[event.eventName]) {
        analytics[event.eventName] = {
          count: 0,
          totalValue: 0,
          lastOccurred: 0,
        };
      }

      analytics[event.eventName].count++;
      analytics[event.eventName].totalValue += event.eventValue || 0;
      analytics[event.eventName].lastOccurred = event.timestamp;
    }

    // Convert to final format
    const result: {
      [eventName: string]: {
        count: number;
        avgValue: number;
        lastOccurred: number;
      };
    } = {};

    for (const [eventName, data] of Object.entries(analytics)) {
      result[eventName] = {
        count: data.count,
        avgValue: data.count > 0 ? data.totalValue / data.count : 0,
        lastOccurred: data.lastOccurred,
      };
    }

    return result;
  }

  /**
   * Optimize Bundle Size
   */
  static analyzeBundleSize(
    modules: Array<{
      name: string;
      size: number;
    }>
  ): {
    totalSize: number;
    largestModules: Array<{ name: string; size: number; percentage: number }>;
    recommendations: string[];
  } {
    const totalSize = modules.reduce((sum, m) => sum + m.size, 0);
    const largestModules = modules
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map((m) => ({
        name: m.name,
        size: m.size,
        percentage: (m.size / totalSize) * 100,
      }));

    const recommendations: string[] = [];

    for (const module of largestModules) {
      if (module.percentage > 10) {
        recommendations.push(`Consider code-splitting ${module.name}`);
      }
    }

    if (totalSize > 500000) {
      recommendations.push('Bundle size exceeds 500KB, consider optimization');
    }

    return {
      totalSize,
      largestModules,
      recommendations,
    };
  }

  /**
   * Get Cache Strategy Recommendations
   */
  static getCacheStrategyRecommendations(
    pageLoadMetrics: PageLoadMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (pageLoadMetrics.domContentLoaded > 3000) {
      recommendations.push('Reduce DOM content load time by optimizing JavaScript');
    }

    if (pageLoadMetrics.firstContentfulPaint > 2000) {
      recommendations.push('Improve First Contentful Paint by optimizing critical resources');
    }

    if (pageLoadMetrics.largestContentfulPaint > 4000) {
      recommendations.push('Optimize Largest Contentful Paint by lazy loading images');
    }

    if (pageLoadMetrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by reserving space for dynamic content');
    }

    return recommendations;
  }

  /**
   * Generate Performance Report
   */
  static generatePerformanceReport(
    metrics: PerformanceMetric[],
    sessions: UserSession[],
    errors: ErrorLog[],
    events: AnalyticsEvent[]
  ): {
    performanceScore: number;
    sessionMetrics: any;
    errorMetrics: any;
    eventMetrics: any;
    recommendations: string[];
  } {
    const perfReport = this.getPerformanceReport(metrics);
    const sessionMetrics = this.getSessionAnalytics(sessions);
    const errorMetrics = this.getErrorAnalytics(errors);
    const eventMetrics = this.getEventAnalytics(events);

    const recommendations: string[] = [];

    if (perfReport.healthScore < 80) {
      recommendations.push('Performance health score below 80%, review failed metrics');
    }

    if (errorMetrics.errorRate > 0.05) {
      recommendations.push('Error rate above 5%, investigate critical errors');
    }

    if (sessionMetrics.averageSessionDuration < 60000) {
      recommendations.push('Average session duration below 1 minute, improve engagement');
    }

    return {
      performanceScore: perfReport.healthScore,
      sessionMetrics,
      errorMetrics,
      eventMetrics,
      recommendations,
    };
  }
}

export default PerformanceService;
