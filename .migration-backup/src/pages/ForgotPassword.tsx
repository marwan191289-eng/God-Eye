import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Loader2, ArrowRight } from "lucide-react";

const emailSchema = z.string().trim().email("بريد إلكتروني غير صالح").max(255);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(email); } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("تم إرسال رابط إعادة التعيين");
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-2xl font-bold mb-4">إعادة تعيين كلمة السر</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-2xl font-semibold leading-none tracking-tight">إعادة تعيين كلمة السر</h2>
          <CardDescription>
            {sent ? "تحقق من بريدك الإلكتروني" : "أدخل بريدك وسنرسل لك رابطاً لإعادة التعيين"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-sm text-muted-foreground space-y-4">
              <p>إن كان البريد مسجلاً، ستصلك رسالة خلال دقائق.</p>
              <Link to="/auth"><Button variant="outline" className="w-full"><ArrowRight className="ml-2 h-4 w-4" />العودة لتسجيل الدخول</Button></Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">البريد الإلكتروني</Label>
                <Input id="fp-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="sr-only">جاري الإرسال...</span>
                  </>
                ) : "إرسال الرابط"}
              </Button>
              <Link to="/auth" className="block text-center text-sm text-primary hover:underline">العودة لتسجيل الدخول</Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}