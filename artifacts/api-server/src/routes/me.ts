import { type IRouter, type Response } from "express";
import { Router } from "express";
import { getAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/backend";
import { db } from "@workspace/db";
import { profilesTable, userRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/authz";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const router: IRouter = Router();

router.get("/", async (req: any, res: Response) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [[profileRow], [roleRow], clerkUser] = await Promise.all([
      db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1),
      db.select().from(userRolesTable).where(eq(userRolesTable.userId, userId)).limit(1),
      clerkClient.users.getUser(userId),
    ]);

    if (!profileRow) {
      const primaryEmail = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      );
      const displayName =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        primaryEmail?.emailAddress?.split("@")[0] ||
        null;
      try {
        await db.insert(profilesTable).values({
          userId,
          displayName,
          avatarUrl: clerkUser.imageUrl ?? null,
          preferredLanguage: "ar",
        });
      } catch {
        // ignore duplicate insert race
      }

      return res.json({
        userId,
        displayName,
        avatarUrl: clerkUser.imageUrl ?? null,
        role: (roleRow?.role ?? "user") as "admin" | "user",
        isAdmin: roleRow?.role === "admin",
      });
    }

    res.json({
      userId,
      displayName: profileRow.displayName ?? null,
      avatarUrl: profileRow.avatarUrl ?? null,
      role: (roleRow?.role ?? "user") as "admin" | "user",
      isAdmin: roleRow?.role === "admin",
    });
  } catch (err) {
    req.log.error({ err }, "me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
