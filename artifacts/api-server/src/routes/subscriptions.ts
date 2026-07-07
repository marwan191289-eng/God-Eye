import { Router, Request, Response, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { eq } from "drizzle-orm";
// Stripe integration — install with: pnpm add stripe
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-11-20.acacia" });

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

/**
 * Get available subscription plans
 */
router.get("/plans", async (req: any, res: Response) => {
  try {
    // Mock subscription plans
    const plans = [
      {
        id: "free",
        name: "Free",
        description: "Get started with basic trading signals",
        price: 0,
        currency: "USD",
        billingPeriod: "monthly",
        features: [
          "Up to 10 signals per month",
          "Basic analytics",
          "Email notifications",
        ],
        maxSignals: 10,
        apiAccess: false,
        advancedAnalytics: false,
        prioritySupport: false,
      },
      {
        id: "pro",
        name: "Professional",
        description: "For serious traders",
        price: 29.99,
        currency: "USD",
        billingPeriod: "monthly",
        features: [
          "Unlimited signals",
          "Advanced analytics",
          "API access",
          "Custom alerts",
          "Priority support",
        ],
        maxSignals: null,
        apiAccess: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customAlerts: true,
      },
      {
        id: "elite",
        name: "Elite",
        description: "For professional traders and institutions",
        price: 99.99,
        currency: "USD",
        billingPeriod: "monthly",
        features: [
          "Everything in Pro",
          "Dedicated account manager",
          "Custom integrations",
          "Advanced reporting",
          "White-label options",
        ],
        maxSignals: null,
        apiAccess: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customAlerts: true,
      },
    ];

    res.json(plans);
  } catch (err) {
    req.log.error({ err }, "getPlans error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get user's current subscription
 */
router.get("/me", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;

    // Mock user subscription
    const subscription = {
      id: "sub_123",
      userId,
      planId: "pro",
      status: "active",
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    };

    res.json(subscription);
  } catch (err) {
    req.log.error({ err }, "getSubscription error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Create subscription
 */
router.post("/", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { planId, paymentMethodId, couponCode } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    // Mock subscription creation
    const subscription = {
      id: `sub_${Date.now()}`,
      userId,
      planId,
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json(subscription);
  } catch (err) {
    req.log.error({ err }, "createSubscription error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Update subscription
 */
router.patch("/:id", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { planId, autoRenew } = req.body;

    // Mock subscription update
    const subscription = {
      id,
      userId,
      planId: planId || "pro",
      status: "active",
      autoRenew: autoRenew !== undefined ? autoRenew : true,
      updatedAt: new Date().toISOString(),
    };

    res.json(subscription);
  } catch (err) {
    req.log.error({ err }, "updateSubscription error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Cancel subscription
 */
router.delete("/:id", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Mock subscription cancellation
    res.json({
      id,
      userId,
      status: "canceled",
      canceledAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "cancelSubscription error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get usage limits
 */
router.get("/usage/limits", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;

    // Mock usage limits
    const limits = {
      userId,
      signalsUsed: 45,
      maxSignals: 100,
      apiCallsUsed: 1250,
      maxApiCalls: 10000,
      storageUsedMb: 250,
      maxStorageMb: 1000,
      resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    };

    res.json(limits);
  } catch (err) {
    req.log.error({ err }, "getUsageLimits error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get payment history
 */
router.get("/payments", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 10, offset = 0 } = req.query;

    // Mock payment history
    const payments = [
      {
        id: "pay_123",
        userId,
        amount: 29.99,
        currency: "USD",
        status: "completed",
        paymentMethod: "card",
        description: "Professional Plan - Monthly",
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "pay_122",
        userId,
        amount: 29.99,
        currency: "USD",
        status: "completed",
        paymentMethod: "card",
        description: "Professional Plan - Monthly",
        paidAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    res.json({
      payments: payments.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
      total: payments.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    req.log.error({ err }, "getPayments error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get invoices
 */
router.get("/invoices", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 10, offset = 0 } = req.query;

    // Mock invoices
    const invoices = [
      {
        id: "inv_123",
        userId,
        invoiceNumber: "INV-2024-001",
        amount: 29.99,
        currency: "USD",
        status: "paid",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    res.json({
      invoices: invoices.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
      total: invoices.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    req.log.error({ err }, "getInvoices error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Apply coupon code
 */
router.post("/coupons/apply", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }

    // Mock coupon validation (replace with Stripe coupon lookup in production)
    const coupon = {
      code,
      discountType: "percentage",
      discountValue: 20,
      valid: true,
    };

    res.json(coupon);
  } catch (err) {
    req.log.error({ err }, "applyCoupon error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Create Stripe Checkout session
 * POST /api/subscriptions/checkout
 * Body: { planId: string, period: "monthly" | "yearly", couponCode?: string }
 *
 * PRODUCTION SETUP:
 * 1. Install Stripe: pnpm add stripe
 * 2. Set STRIPE_SECRET_KEY in environment
 * 3. Create products/prices in Stripe Dashboard
 * 4. Set STRIPE_PRO_MONTHLY_PRICE_ID, STRIPE_PRO_YEARLY_PRICE_ID, etc.
 * 5. Uncomment Stripe import at top of file
 */
router.post("/checkout", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { planId, period = "monthly", couponCode } = req.body;

    if (!planId) return res.status(400).json({ error: "planId is required" });
    if (planId === "free") return res.status(400).json({ error: "Cannot checkout free plan" });

    const appUrl = process.env.APP_URL || "https://tradexray.vercel.app";

    // PRODUCTION: Replace mock with actual Stripe checkout session creation
    // const priceId = planId === "pro"
    //   ? (period === "yearly" ? process.env.STRIPE_PRO_YEARLY_PRICE_ID : process.env.STRIPE_PRO_MONTHLY_PRICE_ID)
    //   : (period === "yearly" ? process.env.STRIPE_ELITE_YEARLY_PRICE_ID : process.env.STRIPE_ELITE_MONTHLY_PRICE_ID);
    // const session = await stripe.checkout.sessions.create({ ... });
    // return res.json({ url: session.url });

    // Mock response for development
    res.json({
      success: true,
      data: {
        url: `${appUrl}/subscriptions?success=true&plan=${planId}&period=${period}`,
        sessionId: `cs_mock_${Date.now()}`,
      },
    });
  } catch (err) {
    req.log.error({ err }, "checkout error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Create Stripe Customer Portal session
 * POST /api/subscriptions/portal
 */
router.post("/portal", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const appUrl = process.env.APP_URL || "https://tradexray.vercel.app";

    // PRODUCTION: Replace mock with actual Stripe portal session
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: stripeCustomerId,
    //   return_url: `${appUrl}/subscriptions`,
    // });
    // return res.json({ url: session.url });

    res.json({
      success: true,
      data: { url: `${appUrl}/subscriptions` },
    });
  } catch (err) {
    req.log.error({ err }, "portal error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 *
 * IMPORTANT: Register this route BEFORE express.json() middleware
 * with express.raw({ type: "application/json" })
 *
 * Set STRIPE_WEBHOOK_SECRET from: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */
router.post("/webhooks/stripe", async (req: any, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    req.log?.error("STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  // Require raw body (must be mounted with express.raw({ type: 'application/json' }))
  if (!Buffer.isBuffer(req.body)) {
    req.log?.error("Stripe webhook requires raw body parser");
    return res.status(500).json({ error: "Webhook misconfigured" });
  }

  try {
    // Lazy-load stripe so the route stays mountable even if package isn't installed yet
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require("stripe");
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: "Stripe not configured" });
    }
    const stripe = new Stripe(stripeKey);
    const event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);

    // TODO: handle event.type (checkout.session.completed, etc.) server-side
    req.log?.info({ type: event.type, id: event.id }, "stripe webhook verified");
    return res.json({ received: true });
  } catch (err: any) {
    req.log?.warn({ err: err?.message }, "stripe webhook verification failed");
    return res.status(400).json({ error: "Invalid signature" });
  }
});

export default router;
