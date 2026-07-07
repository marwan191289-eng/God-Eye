import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";

const emailSchema = z.string().trim().email("بريد إلكتروني غير صالح").max(255);
const passwordSchema = z.string().min(8, "كلمة السر 8 أحرف على الأقل").max(72);
const nameSchema = z.string().trim().min(2, "الاسم قصير جداً").max(80);

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes("Invalid login")) toast.error("بيانات الدخول غير صحيحة");
      else if (error.message.includes("Email not confirmed")) toast.error("يرجى تأكيد بريدك الإلكتروني أولاً");
      else toast.error(error.message);
      return;
    }
    toast.success("تم تسجيل الدخول");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(name);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered")) toast.error("هذا البريد مسجل مسبقاً");
      else toast.error(error.message);
      return;
    }
    toast.success("تم إنشاء الحساب! تحقق من بريدك لتأكيد الحساب.");
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(`فشل تسجيل الدخول عبر ${provider}`);
      setOauthLoading(null);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">مرحباً بك</h1>
          <p className="text-muted-foreground mt-2">سجّل دخولك أو أنشئ حساباً جديداً</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-4">
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="si-email" type="email" dir="ltr" className="pr-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="si-pw">كلمة السر</Label>
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline">نسيت كلمة السر؟</Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="si-pw" type="password" dir="ltr" className="pr-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="sr-only">جاري تسجيل الدخول...</span>
                      </>
                    ) : "دخول"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">الاسم</Label>
                    <div className="relative">
                      <UserIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="su-name" className="pr-9" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="su-email" type="email" dir="ltr" className="pr-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pw">كلمة السر</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="su-pw" type="password" dir="ltr" className="pr-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                    </div>
                    <p className="text-xs text-muted-foreground">8 أحرف على الأقل</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="sr-only">جاري إنشاء الحساب...</span>
                      </>
                    ) : "إنشاء حساب"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">أو متابعة عبر</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => handleOAuth("google")} disabled={!!oauthLoading}>
              {oauthLoading === "google" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="sr-only">جاري تسجيل الدخول عبر Google...</span>
                </>
              ) : (
                <>
                  <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  المتابعة عبر Google
                </>
              )}
            </Button>

            <Button variant="outline" className="w-full" onClick={() => handleOAuth("apple")} disabled={!!oauthLoading}>
              {oauthLoading === "apple" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="sr-only">جاري تسجيل الدخول عبر Apple...</span>
                </>
              ) : (
                <>
                  <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  المتابعة عبر Apple
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          بإنشائك حساباً فأنت توافق على الشروط وسياسة الخصوصية
        </p>
      </div>
    </div>
  );
}
