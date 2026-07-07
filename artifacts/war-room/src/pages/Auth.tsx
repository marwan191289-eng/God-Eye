import { SignIn, SignUp } from "@clerk/react";
import { useState } from "react";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { Zap, TrendingUp, BarChart2, Shield, Sparkles } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Feature Highlights ───────────────────────────────────────────────────────
const features = [
  { icon: TrendingUp, title: "Real-Time Signals", desc: "AI-powered trading signals with high accuracy" },
  { icon: BarChart2, title: "Advanced Analytics", desc: "Deep performance metrics and portfolio insights" },
  { icon: Shield, title: "Risk Management", desc: "Smart stop-loss and risk/reward calculations" },
  { icon: Sparkles, title: "Multi-Asset Coverage", desc: "Crypto, Forex, Stocks and more" },
];

export default function Auth() {
  useDocumentMeta({
    title: "Sign In or Sign Up — TradeXRay AI",
    description: "Access your TradeXRay AI account to view real-time crypto signals, analytics, and portfolio insights.",
    canonicalPath: "/auth",
  });
  const [mode, setMode] = useState<"signin" | "signup">("signin");


  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left Panel — Branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex-col justify-between p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,200,122,0.4) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }} />
        </div>
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">TradeXRay AI</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400/80 font-medium uppercase tracking-wider">Decision Intelligence</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Trade Smarter,<br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Not Harder
              </span>
            </h1>
            <p className="text-slate-400 mt-4 text-base leading-relaxed">
              Professional-grade trading signals and analytics platform. Join thousands of traders making data-driven decisions.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "10K+", label: "Traders" },
            { value: "85%", label: "Win Rate" },
            { value: "24/7", label: "Live Signals" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel — Auth Form ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">TradeXRay AI</span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              {mode === "signin"
                ? "Sign in to access your trading dashboard"
                : "Start your journey with TradeXRay AI today"}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "signin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* Clerk Auth Component */}
          {/* 
            Clerk automatically handles:
            - Email + Password
            - Phone Number (SMS OTP)
            - Google OAuth
            - Apple OAuth
            - Facebook OAuth
            - Twitter/X OAuth
            - GitHub OAuth
            - Microsoft OAuth
            All configured in Clerk Dashboard → User & Authentication → Social Connections
          */}
          <div className="clerk-auth-wrapper">
            {mode === "signin" ? (
              <SignIn
                routing="hash"
                signUpUrl={`${basePath}/auth`}
                afterSignInUrl={`${basePath}/dashboard`}
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none border-none p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-border bg-card hover:bg-muted text-foreground font-medium transition-colors",
                    socialButtonsBlockButtonText: "text-sm",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground text-xs",
                    formFieldLabel: "text-sm font-medium text-foreground",
                    formFieldInput: "bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary",
                    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
                    footerActionLink: "text-primary hover:text-primary/80",
                    identityPreviewText: "text-foreground",
                    identityPreviewEditButton: "text-primary",
                    formResendCodeLink: "text-primary",
                    otpCodeFieldInput: "border-border bg-background text-foreground",
                    alertText: "text-sm",
                    formFieldErrorText: "text-destructive text-xs",
                  },
                  variables: {
                    colorPrimary: "hsl(162, 100%, 41%)",
                    colorBackground: "hsl(var(--background))",
                    colorText: "hsl(var(--foreground))",
                    colorTextSecondary: "hsl(var(--muted-foreground))",
                    colorInputBackground: "hsl(var(--background))",
                    colorInputText: "hsl(var(--foreground))",
                    borderRadius: "0.625rem",
                  },
                }}
              />
            ) : (
              <SignUp
                routing="hash"
                signInUrl={`${basePath}/auth`}
                afterSignUpUrl={`${basePath}/dashboard`}
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none border-none p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-border bg-card hover:bg-muted text-foreground font-medium transition-colors",
                    socialButtonsBlockButtonText: "text-sm",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground text-xs",
                    formFieldLabel: "text-sm font-medium text-foreground",
                    formFieldInput: "bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary",
                    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
                    footerActionLink: "text-primary hover:text-primary/80",
                    identityPreviewText: "text-foreground",
                    identityPreviewEditButton: "text-primary",
                    formResendCodeLink: "text-primary",
                    otpCodeFieldInput: "border-border bg-background text-foreground",
                    alertText: "text-sm",
                    formFieldErrorText: "text-destructive text-xs",
                  },
                  variables: {
                    colorPrimary: "hsl(162, 100%, 41%)",
                    colorBackground: "hsl(var(--background))",
                    colorText: "hsl(var(--foreground))",
                    colorTextSecondary: "hsl(var(--muted-foreground))",
                    colorInputBackground: "hsl(var(--background))",
                    colorInputText: "hsl(var(--foreground))",
                    borderRadius: "0.625rem",
                  },
                }}
              />
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
