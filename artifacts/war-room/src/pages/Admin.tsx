import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck, useAdminListUsers, useAdminSetUserRole, useAdminDeleteUser, useListSignals } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Loader2, Shield, Trash2, LogOut, Users as UsersIcon, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function Admin() {
  useDocumentMeta({
    title: "Admin Console — TradeXRay AI",
    description: "Manage users, roles, and signals in the TradeXRay AI admin console.",
    canonicalPath: "/admin",
  });
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: adminStatus, isLoading: adminCheckLoading } = useAdminCheck({
    query: { enabled: !!user && !authLoading },
  });
  const isAdmin = adminStatus?.isAdmin ?? false;

  const { data: rows = [], isLoading: usersLoading } = useAdminListUsers({
    query: { enabled: isAdmin },
  });

  const { data: signals = [], isLoading: signalsLoading } = useListSignals({
    query: { enabled: isAdmin },
  });

  const setRoleMutation = useAdminSetUserRole({
    mutation: {
      onSuccess: () => {
        toast.success("تم تحديث الدور");
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      },
      onError: () => toast.error("فشل تحديث الدور"),
    },
  });

  const deleteUserMutation = useAdminDeleteUser({
    mutation: {
      onSuccess: () => {
        toast.success("تم حذف المستخدم");
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      },
      onError: () => toast.error("فشل حذف المستخدم"),
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const loading = authLoading || adminCheckLoading || usersLoading || signalsLoading;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardHeader><CardTitle>غير مصرّح</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">هذه الصفحة مخصّصة للمطوّر فقط.</p>
            <Button onClick={() => navigate("/")} className="w-full">العودة للرئيسية</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">لوحة المطوّر</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>المنصة</Button>
            <Button variant="ghost" onClick={() => signOut()}><LogOut className="h-4 w-4 ml-2" />خروج</Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><UsersIcon className="h-8 w-8 text-primary" /><div><div className="text-2xl font-bold">{rows.length}</div><div className="text-xs text-muted-foreground">المستخدمون</div></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Shield className="h-8 w-8 text-primary" /><div><div className="text-2xl font-bold">{rows.filter(r => r.role === "admin").length}</div><div className="text-xs text-muted-foreground">مطوّرون</div></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Activity className="h-8 w-8 text-primary" /><div><div className="text-2xl font-bold">{signals.length}</div><div className="text-xs text-muted-foreground">إشارات حديثة</div></div></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>المستخدمون</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">منذ</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.userId}>
                      <TableCell>{r.displayName || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("ar")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Select value={r.role} onValueChange={(v) => setRoleMutation.mutate({ userId: r.userId, data: { role: v as "admin" | "user" } })}>
                            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">مستخدم</SelectItem>
                              <SelectItem value="admin">مطوّر</SelectItem>
                            </SelectContent>
                          </Select>
                          {r.userId !== user?.id && (
                            <Button size="sm" variant="ghost" onClick={() => {
                              if (confirm("حذف نهائي لهذا المستخدم؟")) {
                                deleteUserMutation.mutate({ userId: r.userId });
                              }
                            }} aria-label="حذف المستخدم">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">لا يوجد مستخدمون</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>سجل الإشارات الأخيرة</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العملة</TableHead>
                    <TableHead className="text-right">الاتجاه</TableHead>
                    <TableHead className="text-right">الدخول</TableHead>
                    <TableHead className="text-right">الثقة</TableHead>
                    <TableHead className="text-right">النتيجة</TableHead>
                    <TableHead className="text-right">منذ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signals.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono">{s.symbol}</TableCell>
                      <TableCell><Badge variant={s.side === "LONG" ? "default" : "destructive"}>{s.side}</Badge></TableCell>
                      <TableCell className="font-mono">{s.entry}</TableCell>
                      <TableCell>{(s.confidence * 100).toFixed(0)}%</TableCell>
                      <TableCell>{s.outcome || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString("ar")}</TableCell>
                    </TableRow>
                  ))}
                  {!signals.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">لا توجد إشارات بعد</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
