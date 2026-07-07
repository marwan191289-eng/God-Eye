import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthProvidersProps {
  onSuccess?: () => void;
  mode?: "signin" | "signup";
}

export const AuthProviders = ({ onSuccess, mode = "signin" }: AuthProvidersProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [usePhone, setUsePhone] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // This would integrate with your backend authentication
      console.log(`${mode} with email:`, email);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSuccess?.();
    } catch (err) {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log(`${mode} with phone:`, phoneNumber);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSuccess?.();
    } catch (err) {
      setError("Phone authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthProvider = (provider: string) => {
    setLoading(true);
    setError("");

    try {
      // Redirect to OAuth provider
      console.log(`Redirecting to ${provider} OAuth...`);
      // In production, this would redirect to your OAuth endpoint
      // window.location.href = `/api/auth/${provider}`;
    } catch (err) {
      setError(`${provider} authentication failed. Please try again.`);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Access your trading dashboard"
              : "Join our trading community"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Providers */}
          <div className="space-y-3">
            <p className="text-sm text-slate-400 text-center">Quick {mode}</p>

            <Button
              variant="outline"
              className="w-full border-slate-600 hover:bg-slate-700"
              onClick={() => handleOAuthProvider("google")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full border-slate-600 hover:bg-slate-700"
              onClick={() => handleOAuthProvider("apple")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 13.5c-.91 0-1.82.55-2.25 1.51.5.89 1.86 1.99 3.75 1.99 2.08 0 3.71-1.7 3.71-4.04 0-2.05-1.23-3.51-2.36-3.51-.88 0-1.53.6-2.3 1.66-.5.7-1.04 1.48-1.97 1.48-.97 0-1.45-.79-1.45-1.9 0-1.57.92-3.39 2.65-3.39 1.62 0 2.5 1.19 2.5 2.71 0 .37-.04.75-.13 1.13-.41 1.8-1.56 3.36-3.14 3.36zm-8.1-6.08c.88 0 1.49.52 1.49 1.50 0 .97-.61 1.50-1.49 1.50-.88 0-1.49-.53-1.49-1.50 0-.98.61-1.50 1.49-1.50zm0 8.16c-.88 0-1.49-.53-1.49-1.51 0-.97.61-1.50 1.49-1.50.88 0 1.49.53 1.49 1.50 0 .98-.61 1.51-1.49 1.51zm8.1-8.16c.88 0 1.49.52 1.49 1.50 0 .97-.61 1.50-1.49 1.50-.88 0-1.49-.53-1.49-1.50 0-.98.61-1.50 1.49-1.50z" />
                </svg>
                Apple
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full border-slate-600 hover:bg-slate-700"
              onClick={() => handleOAuthProvider("facebook")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full border-slate-600 hover:bg-slate-700"
              onClick={() => handleOAuthProvider("twitter")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 002.856-3.51 10 10 0 01-2.856.15 10 10 0 003.341 1.25 10 10 0 01-1.671.7 10 10 0 003.141 1.298 10 10 0 01-4.908 2.062A10 10 0 0023 11.001c0 .993-.119 1.968-.35 2.91a14.7 14.7 0 01-4.175-1.195z" />
                </svg>
                Twitter
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Email/Phone Toggle */}
          <div className="flex gap-2">
            <Button
              variant={!usePhone ? "default" : "outline"}
              className="flex-1"
              onClick={() => setUsePhone(false)}
            >
              Email
            </Button>
            <Button
              variant={usePhone ? "default" : "outline"}
              className="flex-1"
              onClick={() => setUsePhone(true)}
            >
              Phone
            </Button>
          </div>

          {/* Email Form */}
          {!usePhone && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600"
                  required
                />
              </div>

              {mode === "signin" && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-slate-700 border-slate-600"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === "signin" ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  `${mode === "signin" ? "Sign In" : "Create Account"} with Email`
                )}
              </Button>
            </form>
          )}

          {/* Phone Form */}
          {usePhone && (
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-slate-400">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <a href="/signup" className="text-emerald-500 hover:text-emerald-400">
                  Sign up
                </a>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <a href="/signin" className="text-emerald-500 hover:text-emerald-400">
                  Sign in
                </a>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthProviders;
