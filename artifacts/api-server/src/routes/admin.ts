import { type IRouter, type Response } from "express";
import { Router } from "express";
import { getAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/backend";
import { db } from "@workspace/db";
import { userRolesTable, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AdminSetUserRoleBody } from "@workspace/api-zod";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.userId;
  const role = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId))
    .limit(1);
  if (!role.length || role[0].role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

router.get("/check", requireAuth, async (req: any, res: Response) => {
  try {
    const roles = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, req.userId));
    const isAdmin = roles.some((r) => r.role === "admin");
    res.json({ isAdmin });
  } catch (err) {
    req.log.error({ err }, "adminCheck error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const [clerkUsers, dbRoles] = await Promise.all([
      clerkClient.users.getUserList({ limit: 500 }),
      db.select().from(userRolesTable),
    ]);

    const roleMap = new Map(dbRoles.map((r) => [r.userId, r.role]));

    const result = clerkUsers.data.map((u) => {
      const primaryEmail = u.emailAddresses.find(
        (e) => e.id === u.primaryEmailAddressId,
      );
      return {
        userId: u.id,
        email: primaryEmail?.emailAddress ?? "",
        displayName:
          [u.firstName, u.lastName].filter(Boolean).join(" ") ||
          primaryEmail?.emailAddress?.split("@")[0] ||
          null,
        avatarUrl: u.imageUrl ?? null,
        role: (roleMap.get(u.id) ?? "user") as "admin" | "user",
        createdAt: new Date(u.createdAt).toISOString(),
      };
    });

    result.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "adminListUsers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:userId/role", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const parsed = AdminSetUserRoleBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    const { userId } = req.params;
    const { role } = parsed.data;

    await db.delete(userRolesTable).where(eq(userRolesTable.userId, userId));
    await db.insert(userRolesTable).values({ userId, role });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "adminSetUserRole error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:userId", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;

    await Promise.all([
      db.delete(userRolesTable).where(eq(userRolesTable.userId, userId)),
      db.delete(profilesTable).where(eq(profilesTable.userId, userId)),
    ]);

    try {
      await clerkClient.users.deleteUser(userId);
    } catch (clerkErr: any) {
      if (clerkErr?.status !== 404) {
        req.log.warn({ clerkErr }, "Clerk deleteUser failed (non-404)");
      }
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "adminDeleteUser error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
