import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, userRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: "admin" | "user";
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const rows = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, userId))
      .limit(1);
    if (!rows.length || rows[0].role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.userRole = "admin";
    next();
  } catch {
    return res.status(500).json({ error: "Authorization check failed" });
  }
}
