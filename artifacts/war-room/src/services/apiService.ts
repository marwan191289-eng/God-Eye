import crypto from 'crypto';

interface APIKey {
  id: string;
  userId: string;
  key: string;
  secret: string;
  name: string;
  permissions: string[];
  ipWhitelist: string[];
  isActive: boolean;
  createdAt: number;
  lastUsedAt?: number;
}

interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requiresAuth: boolean;
  rateLimit: number; // requests per minute
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses: {
    [statusCode: number]: {
      description: string;
      schema: any;
    };
  };
}

interface APIUsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  bandwidthUsed: number;
  lastResetAt: number;
}

interface WebhookEvent {
  id: string;
  userId: string;
  event: string;
  payload: any;
  url: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  createdAt: number;
  deliveredAt?: number;
}

/**
 * API Service
 * Handles API key management, endpoints, and integrations
 */
export class APIService {
  private static readonly API_ENDPOINTS: APIEndpoint[] = [
    // Trading Endpoints
    {
      path: '/api/v1/orders',
      method: 'POST',
      description: 'Create a new order',
      requiresAuth: true,
      rateLimit: 100,
      parameters: [
        { name: 'symbol', type: 'string', required: true, description: 'Trading pair (e.g., BTCUSDT)' },
        { name: 'side', type: 'string', required: true, description: 'BUY or SELL' },
        { name: 'type', type: 'string', required: true, description: 'LIMIT, MARKET, STOP_LOSS, etc.' },
        { name: 'quantity', type: 'number', required: true, description: 'Order quantity' },
        { name: 'price', type: 'number', required: false, description: 'Order price (required for LIMIT)' },
      ],
      responses: {
        200: {
          description: 'Order created successfully',
          schema: { orderId: 'string', status: 'string', createdAt: 'number' },
        },
        400: { description: 'Invalid parameters', schema: { error: 'string' } },
        401: { description: 'Unauthorized', schema: { error: 'string' } },
      },
    },
    {
      path: '/api/v1/orders/{orderId}',
      method: 'GET',
      description: 'Get order details',
      requiresAuth: true,
      rateLimit: 200,
      parameters: [
        { name: 'orderId', type: 'string', required: true, description: 'Order ID' },
      ],
      responses: {
        200: {
          description: 'Order details retrieved',
          schema: { orderId: 'string', status: 'string', filled: 'number' },
        },
      },
    },
    {
      path: '/api/v1/orders/{orderId}',
      method: 'DELETE',
      description: 'Cancel an order',
      requiresAuth: true,
      rateLimit: 100,
      parameters: [
        { name: 'orderId', type: 'string', required: true, description: 'Order ID' },
      ],
      responses: {
        200: { description: 'Order cancelled', schema: { orderId: 'string', status: 'string' } },
      },
    },

    // Account Endpoints
    {
      path: '/api/v1/account',
      method: 'GET',
      description: 'Get account information',
      requiresAuth: true,
      rateLimit: 50,
      parameters: [],
      responses: {
        200: {
          description: 'Account info retrieved',
          schema: { userId: 'string', email: 'string', kycStatus: 'string' },
        },
      },
    },
    {
      path: '/api/v1/account/balances',
      method: 'GET',
      description: 'Get wallet balances',
      requiresAuth: true,
      rateLimit: 100,
      parameters: [],
      responses: {
        200: {
          description: 'Balances retrieved',
          schema: { balances: [{ currency: 'string', balance: 'number' }] },
        },
      },
    },

    // Market Data Endpoints
    {
      path: '/api/v1/market/candles',
      method: 'GET',
      description: 'Get candlestick data',
      requiresAuth: false,
      rateLimit: 200,
      parameters: [
        { name: 'symbol', type: 'string', required: true, description: 'Trading pair' },
        { name: 'timeframe', type: 'string', required: true, description: '1m, 5m, 1h, 1d, etc.' },
        { name: 'limit', type: 'number', required: false, description: 'Number of candles (default: 100)' },
      ],
      responses: {
        200: {
          description: 'Candles retrieved',
          schema: { candles: [{ time: 'number', open: 'number', close: 'number' }] },
        },
      },
    },
    {
      path: '/api/v1/market/ticker',
      method: 'GET',
      description: 'Get ticker information',
      requiresAuth: false,
      rateLimit: 300,
      parameters: [
        { name: 'symbol', type: 'string', required: true, description: 'Trading pair' },
      ],
      responses: {
        200: {
          description: 'Ticker data retrieved',
          schema: { symbol: 'string', price: 'number', change24h: 'number' },
        },
      },
    },

    // Signals Endpoints
    {
      path: '/api/v1/signals',
      method: 'GET',
      description: 'Get AI trading signals',
      requiresAuth: true,
      rateLimit: 50,
      parameters: [
        { name: 'symbol', type: 'string', required: false, description: 'Filter by symbol' },
        { name: 'timeframe', type: 'string', required: false, description: 'Filter by timeframe' },
      ],
      responses: {
        200: {
          description: 'Signals retrieved',
          schema: { signals: [{ symbol: 'string', signal: 'string', confidence: 'number' }] },
        },
      },
    },

    // Webhook Endpoints
    {
      path: '/api/v1/webhooks',
      method: 'POST',
      description: 'Create a webhook',
      requiresAuth: true,
      rateLimit: 20,
      parameters: [
        { name: 'event', type: 'string', required: true, description: 'Event type' },
        { name: 'url', type: 'string', required: true, description: 'Webhook URL' },
      ],
      responses: {
        200: { description: 'Webhook created', schema: { webhookId: 'string' } },
      },
    },
  ];

  /**
   * Create API Key
   */
  static createAPIKey(
    userId: string,
    name: string,
    permissions: string[],
    ipWhitelist: string[] = []
  ): APIKey {
    const key = this.generateAPIKey();
    const secret = this.generateAPISecret();

    return {
      id: crypto.randomUUID(),
      userId,
      key,
      secret,
      name,
      permissions,
      ipWhitelist,
      isActive: true,
      createdAt: Date.now(),
    };
  }

  /**
   * Generate API Key
   */
  static generateAPIKey(): string {
    return 'key_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate API Secret
   */
  static generateAPISecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Validate API Key
   */
  static validateAPIKey(apiKey: APIKey, ipAddress: string): boolean {
    if (!apiKey.isActive) {
      return false;
    }

    if (apiKey.ipWhitelist.length > 0 && !apiKey.ipWhitelist.includes(ipAddress)) {
      return false;
    }

    return true;
  }

  /**
   * Get API Endpoints
   */
  static getAPIEndpoints(): APIEndpoint[] {
    return this.API_ENDPOINTS;
  }

  /**
   * Get Endpoint by Path
   */
  static getEndpointByPath(path: string, method: string): APIEndpoint | undefined {
    return this.API_ENDPOINTS.find((e) => e.path === path && e.method === method as any);
  }

  /**
   * Generate API Documentation
   */
  static generateAPIDocumentation(): string {
    let doc = '# TradeXRay API Documentation\n\n';

    for (const endpoint of this.API_ENDPOINTS) {
      doc += `## ${endpoint.method} ${endpoint.path}\n\n`;
      doc += `${endpoint.description}\n\n`;
      doc += `**Rate Limit:** ${endpoint.rateLimit} requests/minute\n\n`;

      if (endpoint.parameters.length > 0) {
        doc += '### Parameters\n\n';
        for (const param of endpoint.parameters) {
          doc += `- **${param.name}** (${param.type}${param.required ? ', required' : ', optional'}): ${param.description}\n`;
        }
        doc += '\n';
      }

      doc += '### Responses\n\n';
      for (const [status, response] of Object.entries(endpoint.responses)) {
        doc += `- **${status}**: ${response.description}\n`;
      }
      doc += '\n---\n\n';
    }

    return doc;
  }

  /**
   * Track API Usage
   */
  static trackAPIUsage(
    apiKey: APIKey,
    endpoint: string,
    responseTime: number,
    statusCode: number,
    bandwidth: number
  ): APIUsageMetrics {
    return {
      totalRequests: 1,
      successfulRequests: statusCode >= 200 && statusCode < 300 ? 1 : 0,
      failedRequests: statusCode >= 400 ? 1 : 0,
      averageResponseTime: responseTime,
      bandwidthUsed: bandwidth,
      lastResetAt: Date.now(),
    };
  }

  /**
   * Create Webhook
   */
  static createWebhook(
    userId: string,
    event: string,
    url: string
  ): WebhookEvent {
    return {
      id: crypto.randomUUID(),
      userId,
      event,
      payload: {},
      url,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
    };
  }

  /**
   * Trigger Webhook
   */
  static triggerWebhook(
    webhook: WebhookEvent,
    payload: any
  ): WebhookEvent {
    webhook.payload = payload;
    webhook.status = 'pending';
    webhook.attempts = 0;

    return webhook;
  }

  /**
   * Mark Webhook as Delivered
   */
  static markWebhookDelivered(webhook: WebhookEvent): WebhookEvent {
    webhook.status = 'delivered';
    webhook.deliveredAt = Date.now();

    return webhook;
  }

  /**
   * Mark Webhook as Failed
   */
  static markWebhookFailed(webhook: WebhookEvent): WebhookEvent {
    webhook.status = 'failed';
    webhook.attempts++;

    return webhook;
  }

  /**
   * Get Rate Limit Info
   */
  static getRateLimitInfo(
    apiKey: APIKey,
    endpoint: APIEndpoint,
    requestCount: number
  ): {
    limit: number;
    remaining: number;
    resetAt: number;
  } {
    const limit = endpoint.rateLimit;
    const remaining = Math.max(0, limit - requestCount);
    const resetAt = Date.now() + 60 * 1000; // Reset in 1 minute

    return {
      limit,
      remaining,
      resetAt,
    };
  }

  /**
   * Validate Request Signature
   */
  static validateRequestSignature(
    apiSecret: string,
    timestamp: string,
    body: string,
    signature: string
  ): boolean {
    const message = timestamp + body;
    const crypto_module = require('crypto');
    const hash = crypto_module
      .createHmac('sha256', apiSecret)
      .update(message)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Generate Request Signature
   */
  static generateRequestSignature(apiSecret: string, timestamp: string, body: string): string {
    const message = timestamp + body;
    const crypto_module = require('crypto');
    return crypto_module
      .createHmac('sha256', apiSecret)
      .update(message)
      .digest('hex');
  }

  /**
   * Get Webhook Events
   */
  static getWebhookEvents(): string[] {
    return [
      'order.created',
      'order.filled',
      'order.cancelled',
      'trade.opened',
      'trade.closed',
      'signal.generated',
      'price.alert',
      'deposit.received',
      'withdrawal.completed',
      'subscription.upgraded',
    ];
  }

  /**
   * Export API Specification (OpenAPI/Swagger)
   */
  static exportOpenAPISpec(): any {
    return {
      openapi: '3.0.0',
      info: {
        title: 'TradeXRay API',
        version: '1.0.0',
        description: 'Comprehensive trading and market data API',
      },
      servers: [
        {
          url: 'https://api.tradexray.ai',
          description: 'Production server',
        },
      ],
      paths: this.generateOpenAPIPaths(),
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
      },
    };
  }

  /**
   * Generate OpenAPI Paths
   */
  private static generateOpenAPIPaths(): any {
    const paths: any = {};

    for (const endpoint of this.API_ENDPOINTS) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        parameters: endpoint.parameters,
        responses: endpoint.responses,
      };
    }

    return paths;
  }
}

export default APIService;
