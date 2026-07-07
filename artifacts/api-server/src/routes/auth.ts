import { Router, type IRouter, type Response } from "express";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

/**
 * SECURITY NOTE:
 * Authentication, email/phone verification, password resets, MFA, and OAuth
 * are handled by Clerk on the client and verified server-side via
 * clerkMiddleware() + getAuth(). The previous mock endpoints that returned
 * `{ authenticated: true }` for any token are removed — they were an auth
 * bypass risk if any caller trusted them.
 *
 * Anything that requires bypassing Clerk must be added here with real
 * provider/token validation, never mock responses.
 */

router.post("/verify-email", (_req, res: Response) => {
  res.status(501).json({ error: "Use Clerk verification flow on the client" });
});

router.post("/verify-phone", (_req, res: Response) => {
  res.status(501).json({ error: "Use Clerk verification flow on the client" });
});

router.post("/send-email-code", (_req, res: Response) => {
  res.status(501).json({ error: "Use Clerk verification flow on the client" });
});

router.post("/send-phone-code", (_req, res: Response) => {
  res.status(501).json({ error: "Use Clerk verification flow on the client" });
});

router.post("/oauth/:provider/callback", (_req, res: Response) => {
  res.status(501).json({ error: "OAuth is handled by Clerk on the client" });
});

router.post("/logout", (req: any, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
  // Session invalidation is performed by Clerk on the client.
  res.json({ loggedOut: true });
});

export default router;
