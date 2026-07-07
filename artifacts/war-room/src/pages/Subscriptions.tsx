import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Check, X, AlertCircle, CreditCard, Download, Zap,
  Star, Crown, Building2, ArrowRight, Tag, RefreshCw,
  TrendingUp, BarChart2, Bell, Code2, Headphones, Shield,
  Infinity, Users, Globe, Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

// ─── Plan Definitions ─────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Get started with trading signals",
    price: { monthly: 0, yearly: 0 },
    icon: Zap,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    features: [
      { text: "10 signals per month", included: true, icon: TrendingUp },
      { text: "Basic analytics dashboard", included: true, icon: BarChart2 },
      { text: "Email notifications", included: true, icon: Bell },
      { text: "Advanced analytics", included: false, icon: BarChart2 },
      { text: "API access", included: false, icon: Code2 },
      { text: "Priority support", included: false, icon: Headphones },
      { text: "Custom alerts", included: false, icon: Bell },
      { text: "White-label options", included: false, icon: Globe },
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    id: "pro",
    name: "Professional",
    tagline: "For serious traders",
    price: { monthly: 29.99, yearly: 24.99 },
    icon: Star,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    features: [
      { text: "Unlimited signals", included: true, icon: Infinity },
      { text: "Advanced analytics", included: true, icon: BarChart2 },
      { text: "API access (10K calls/mo)", included: true, icon: Code2 },
      { text: "Custom alerts & webhooks", included: true, icon: Bell },
      { text: "Priority support", included: true, icon: Headphones },
      { text: "Risk/Reward calculator", included: true, icon: Shield },
      { text: "Multi-timeframe analysis", included: true, icon: TrendingUp },
      { text: "White-label options", included: false, icon: Globe },
    ],
    cta: "Start Pro Trial",
    popular: true,
    trialDays: 14,
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "For institutions & power users",
    price: { monthly: 99.99, yearly: 83.33 },
    icon: Crown,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    features: [
      { text: "Everything in Professional", included: true, icon: Check },
      { text: "Unlimited API calls", included: true, icon: Infinity },
      { text: "Dedicated account manager", included: true, icon: Users },
      { text: "Custom integrations", included: true, icon: Code2 },
      { text: "Advanced reporting suite", included: true, icon: BarChart2 },
      { text: "White-label options", included: true, icon: Globe },
      { text: "SLA guarantee", included: true, icon: Shield },
      { text: "On-premise deployment", included: true, icon: Building2 },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

// ─── Usage Limits ─────────────────────────────────────────────────────────────
const USAGE_DATA = [
  { label: "Signals Used", current: 45, max: 100, unit: "", color: "bg-primary" },
  { label: "API Calls", current: 1250, max: 10000, unit: "", color: "bg-blue-500" },
  { label: "Storage", current: 250, max: 1024, unit: "MB", color: "bg-amber-500" },
  { label: "Webhooks", current: 2, max: 5, unit: "", color: "bg-purple-500" },
];

// ─── Plan Card Component ──────────────────────────────────────────────────────
const PlanCard = ({
  plan,
  isCurrentPlan,
  billingPeriod,
  onSelect,
}: {
  plan: (typeof PLANS)[0];
  isCurrentPlan: boolean;
  billingPeriod: "monthly" | "yearly";
  onSelect: (planId: string) => void;
}) => {
  const Icon = plan.icon;
  const price = plan.price[billingPeriod];
  const yearlyDiscount = billingPeriod === "yearly" && plan.price.monthly > 0
    ? Math.round((1 - plan.price.yearly / plan.price.monthly) * 100)
    : 0;

  return (
    <Card className={`relative flex flex-col transition-all duration-200 ${
      isCurrentPlan
        ? `border-2 ${plan.borderColor} shadow-lg`
        : `border hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5`
    } ${plan.popular && !isCurrentPlan ? "border-primary/40" : ""}`}>
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Current Plan
          </span>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${plan.bgColor} border ${plan.borderColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${plan.color}`} />
          </div>
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <CardDescription className="text-xs">{plan.tagline}</CardDescription>
          </div>
        </div>

        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold text-foreground tabular-nums">
            ${price === 0 ? "0" : price.toFixed(2)}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground text-sm mb-1">
              /mo{billingPeriod === "yearly" ? " (billed yearly)" : ""}
            </span>
          )}
        </div>
        {yearlyDiscount > 0 && (
          <Badge variant="secondary" className="w-fit text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Save {yearlyDiscount}% with annual billing
          </Badge>
        )}
        {plan.trialDays && !isCurrentPlan && (
          <p className="text-xs text-primary font-medium">{plan.trialDays}-day free trial included</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Features */}
        <ul className="space-y-2.5 flex-1">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2.5 text-sm">
              {feature.included ? (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
              )}
              <span className={feature.included ? "text-foreground" : "text-muted-foreground/50 line-through"}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        {isCurrentPlan ? (
          <Button disabled className="w-full bg-muted text-muted-foreground cursor-default">
            <Check className="w-4 h-4 mr-2" />
            Current Plan
          </Button>
        ) : plan.id === "elite" ? (
          <Button
            variant="outline"
            className={`w-full border-2 ${plan.borderColor} ${plan.color} hover:bg-amber-500/10`}
            onClick={() => onSelect(plan.id)}
          >
            {plan.cta}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
            variant={plan.popular ? "default" : "outline"}
            onClick={() => onSelect(plan.id)}
          >
            {plan.cta}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main Subscriptions Component ────────────────────────────────────────────
const Subscriptions = () => {
  useDocumentMeta({
    title: "Subscriptions & Pricing — TradeXRay AI",
    description: "Compare TradeXRay AI plans and pricing. Choose the right tier for your crypto trading workflow.",
    canonicalPath: "/subscriptions",
  });
  const { user } = useUser();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [currentPlanId, setCurrentPlanId] = useState("pro");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPlan = PLANS.find((p) => p.id === currentPlanId);

  const handleSelectPlan = (planId: string) => {
    if (planId === "elite") {
      toast.info("Contact our sales team for Elite plan pricing and custom setup.");
      return;
    }
    if (planId === currentPlanId) return;

    // In production: redirect to Stripe Checkout
    // window.location.href = `/api/subscriptions/checkout?planId=${planId}&period=${billingPeriod}`;
    toast.info(`Redirecting to payment for ${PLANS.find(p => p.id === planId)?.name} plan...`);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    setLoading(true);
    // In production: POST /api/subscriptions/coupons/apply
    setTimeout(() => {
      setCouponApplied(true);
      setLoading(false);
      toast.success("Coupon applied! 20% discount activated.");
    }, 800);
  };

  const mockPayments = [
    { id: "pay_001", amount: 29.99, currency: "USD", status: "completed", description: "Professional Plan — Monthly", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { id: "pay_002", amount: 29.99, currency: "USD", status: "completed", description: "Professional Plan — Monthly", date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
    { id: "pay_003", amount: 29.99, currency: "USD", status: "completed", description: "Professional Plan — Monthly", date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000) },
  ];

  return (
    <div className="w-full min-h-full bg-background p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Subscription Plans
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your subscription and billing
            </p>
          </div>
        </div>

        {/* ── Current Subscription Banner ─────────────────────────────────────── */}
        {currentPlan && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${currentPlan.bgColor} border ${currentPlan.borderColor} flex items-center justify-center`}>
                    <currentPlan.icon className={`w-6 h-6 ${currentPlan.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-lg">{currentPlan.name} Plan</h3>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Renews on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      ${currentPlan.price.monthly.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="bg-muted/50 border border-border h-auto p-1">
            <TabsTrigger value="plans" className="text-xs">Plans</TabsTrigger>
            <TabsTrigger value="billing" className="text-xs">Billing History</TabsTrigger>
            <TabsTrigger value="usage" className="text-xs">Usage</TabsTrigger>
            <TabsTrigger value="payment" className="text-xs">Payment Methods</TabsTrigger>
          </TabsList>

          {/* ── Plans Tab ───────────────────────────────────────────────────── */}
          <TabsContent value="plans" className="mt-6 space-y-6">
            {/* Billing Period Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={billingPeriod === "yearly"}
                aria-label="Toggle yearly billing"
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  billingPeriod === "yearly" ? "bg-primary" : "bg-muted"
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  billingPeriod === "yearly" ? "translate-x-7" : "translate-x-1"
                }`} />
              </button>
              <span className={`text-sm font-medium flex items-center gap-1.5 ${billingPeriod === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-1.5 py-0">
                  Save 17%
                </Badge>
              </span>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={plan.id === currentPlanId}
                  billingPeriod={billingPeriod}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>

            {/* Coupon Code */}
            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Coupon Code
                </CardTitle>
                <CardDescription>Have a discount code? Apply it here.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 max-w-sm">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                    disabled={couponApplied}
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || couponApplied || loading}
                    variant={couponApplied ? "outline" : "default"}
                    className={couponApplied ? "border-emerald-500 text-emerald-500" : ""}
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : couponApplied ? (
                      <><Check className="w-4 h-4 mr-1" /> Applied</>
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    20% discount applied to your next payment
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods Info */}
            <Alert className="bg-blue-500/5 border-blue-500/20">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                <strong>Secure payments powered by Stripe.</strong> We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and more. All transactions are encrypted and PCI-DSS compliant.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* ── Billing History Tab ─────────────────────────────────────────── */}
          <TabsContent value="billing" className="mt-4 space-y-4">
            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment History</CardTitle>
                <CardDescription>Your recent transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{payment.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-foreground tabular-nums">
                            ${payment.amount.toFixed(2)} {payment.currency}
                          </p>
                          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            {payment.status}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Invoices</CardTitle>
                <CardDescription>Download PDF invoices for your records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockPayments.map((payment, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          INV-{new Date().getFullYear()}-{String(i + 1).padStart(3, "0")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          {" · "}${payment.amount.toFixed(2)} USD
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                        <Download className="w-3 h-3" />
                        PDF
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Usage Tab ───────────────────────────────────────────────────── */}
          <TabsContent value="usage" className="mt-4 space-y-4">
            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Usage Statistics</CardTitle>
                <CardDescription>
                  Current period usage · Resets on{" "}
                  {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {USAGE_DATA.map((item) => {
                  const pct = (item.current / item.max) * 100;
                  const isWarning = pct >= 80;
                  const isCritical = pct >= 95;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {isWarning && (
                            <AlertCircle className={`w-3.5 h-3.5 ${isCritical ? "text-red-500" : "text-amber-500"}`} />
                          )}
                          <span className={`text-sm font-bold tabular-nums ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-foreground"}`}>
                            {item.current.toLocaleString()}{item.unit} / {item.max.toLocaleString()}{item.unit}
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : item.color
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% used</p>
                    </div>
                  );
                })}

                <Alert className="bg-blue-500/5 border-blue-500/20 mt-4">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-sm">
                    Need more? Upgrade to Elite for unlimited signals and API calls.{" "}
                    <button className="text-primary font-semibold hover:underline">Upgrade now →</button>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Payment Methods Tab ─────────────────────────────────────────── */}
          <TabsContent value="payment" className="mt-4 space-y-4">
            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment Methods</CardTitle>
                <CardDescription>Manage your saved payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Saved Card */}
                <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">VISA</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">•••• •••• •••• 4242</p>
                      <p className="text-xs text-muted-foreground">Expires 12/26</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Default</Badge>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                      Remove
                    </Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2 border-dashed">
                  <CreditCard className="w-4 h-4" />
                  Add Payment Method
                </Button>

                <Separator />

                {/* Accepted Payment Methods */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Accepted Payment Methods
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", "PayPal", "Bank Transfer"].map((method) => (
                      <span key={method} className="text-xs px-2.5 py-1 rounded-lg bg-muted border border-border text-muted-foreground font-medium">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                <Alert className="bg-muted/50 border-border">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <AlertDescription className="text-xs text-muted-foreground">
                    Your payment information is encrypted and secured by Stripe. We never store your full card details.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Subscriptions;
