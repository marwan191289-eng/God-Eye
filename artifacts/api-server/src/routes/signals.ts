import { type IRouter, type Response } from "express";
import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { signalLogTable, userRolesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { CreateSignalBody } from "@workspace/api-zod";

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

router.get("/", requireAuth, async (req: any, res: Response) => {
  try {
    const signals = await db
      .select()
      .from(signalLogTable)
      .orderBy(desc(signalLogTable.createdAt))
      .limit(50);

    const result = signals.map((s) => ({
      id: s.id,
      symbol: s.symbol,
      side: s.side as "LONG" | "SHORT",
      entry: Number(s.entry),
      stop: s.stop ? Number(s.stop) : null,
      target: s.target ? Number(s.target) : null,
      confidence: Number(s.confidence),
      outcome: s.outcome ?? null,
      pnlPct: s.pnlPct ? Number(s.pnlPct) : null,
      createdAt: s.createdAt.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "listSignals error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, requireAdmin, async (req: any, res: Response) => {
  try {
    const parsed = CreateSignalBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    const { symbol, side, entry, stop, target, confidence } = parsed.data;
    const [inserted] = await db
      .insert(signalLogTable)
      .values({
        symbol,
        side,
        entry: String(entry),
        stop: stop ? String(stop) : null,
        target: target ? String(target) : null,
        confidence: String(confidence),
      })
      .returning();

    res.status(201).json({
      id: inserted.id,
      symbol: inserted.symbol,
      side: inserted.side as "LONG" | "SHORT",
      entry: Number(inserted.entry),
      stop: inserted.stop ? Number(inserted.stop) : null,
      target: inserted.target ? Number(inserted.target) : null,
      confidence: Number(inserted.confidence),
      outcome: inserted.outcome ?? null,
      pnlPct: inserted.pnlPct ? Number(inserted.pnlPct) : null,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "createSignal error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
