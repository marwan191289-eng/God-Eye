import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

// Authentication rate limiter - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'auth:limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'POST',
});

// API rate limiter - 100 requests per minute
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'api:limit:',
  }),
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again later',
});

// Trading rate limiter - 50 orders per minute
export const tradingLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'trade:limit:',
  }),
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: 'Too many trading requests, please slow down',
});

// Withdrawal rate limiter - 3 per 24 hours
export const withdrawalLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'withdrawal:limit:',
  }),
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: 'Too many withdrawal requests, limit is 3 per 24 hours',
});

// General rate limiter - 1000 requests per hour
export const generalLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'general:limit:',
  }),
  windowMs: 1 * 60 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP',
});
