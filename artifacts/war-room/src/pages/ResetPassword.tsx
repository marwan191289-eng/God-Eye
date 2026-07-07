import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function ResetPassword() {
  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-2xl font-bold mb-4">كلمة سر جديدة</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-2xl font-semibold leading-none tracking-tight">كلمة سر جديدة</h2>
          <CardDescription>تمت إعادة تعيين كلمة السر عبر رابط البريد الإلكتروني</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/auth">
            <Button variant="outline" className="w-full">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة لتسجيل الدخول
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}