import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.userId = userId;
  next();
}

/**
 * Middleware to optionally attach user info
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (auth?.userId) {
    req.userId = auth.userId;
  }
  next();
}

/**
 * Middleware to require specific role
 */
export function requireRole(role: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // This would check the database for user role
    // For now, we'll assume admin role for demonstration
    if (role === "admin") {
      // Check if user is admin in database
      // const userRole = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, userId));
      // if (!userRole.length || userRole[0].role !== "admin") {
      //   return res.status(403).json({ error: "Forbidden" });
      // }
    }

    next();
  };
}

/**
 * Middleware for rate limiting
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  const requests: Map<string, number[]> = new Map();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const key = req.userId || req.ip || "anonymous";
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key)!;
    const recentRequests = userRequests.filter((time) => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ error: "Too many requests" });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
}

/**
 * Middleware for error handling
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Error:", err);

  if (err.status === 401) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (err.status === 403) {
    return res.status(403).json({ error: "Forbidden" });
  }

  res.status(500).json({ error: "Internal server error" });
}

/**
 * Middleware for CORS
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  if (allowedOrigins.includes(origin || "")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
}
