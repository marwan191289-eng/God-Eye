import { useState } from "react";
import { useUser, useClerk } from "@clerk/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User, Bell, Shield, Key, Palette,
  Copy, RefreshCw, Eye, EyeOff, Check, AlertCircle,
  Smartphone, Chrome, Apple, Facebook, Twitter,
  Trash2, Download, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const ConnectedAccount = ({ provider, icon: Icon, connected, email, onToggle }: any) => (
  <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/20 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${connected ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"}`}>
        <Icon className={`w-4 h-4 ${connected ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{provider}</p>
        <p className="text-xs text-muted-foreground">{connected && email ? email : "Not connected"}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {connected && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Connected</Badge>}
      <Button variant={connected ? "outline" : "default"} size="sm" className="h-7 text-xs" onClick={onToggle}>
        {connected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  </div>
);

const ApiKeyItem = ({ name, keyValue, createdAt, lastUsed, onRevoke }: any) => {
  const [visible, setVisible] = useState(false);
  const masked = keyValue.slice(0, 8) + "•".repeat(20) + keyValue.slice(-4);
  return (
    <div className="p-4 rounded-xl border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">Created {createdAt} · Last used: {lastUsed}</p>
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10" onClick={onRevoke}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg font-mono text-foreground border border-border truncate">
          {visible ? keyValue : masked}
        </code>
        <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0" onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0" onClick={() => { navigator.clipboard.writeText(keyValue); toast.success("Copied!"); }}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

const Settings = () => {
  useDocumentMeta({
    title: "Settings — TradeXRay AI",
    description: "Manage your TradeXRay AI account, notifications, connected exchanges, and preferences.",
    canonicalPath: "/settings",
  });
  const { user } = useUser();
  const { signOut } = useClerk();
  const [notifications, setNotifications] = useState({ emailSignals: true, emailWeeklyReport: true, emailMarketing: false, pushSignals: true, pushPriceAlerts: true, pushSystemUpdates: false, smsSignals: false, smsAlerts: false });
  const [preferences, setPreferences] = useState({ theme: "dark", language: "en", currency: "USD", timezone: "UTC", defaultTimeframe: "1D", compactMode: false, showPnlInPercent: true, autoRefresh: true, refreshInterval: "30" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => { setSaving(true); await new Promise(r => setTimeout(r, 800)); setSaving(false); toast.success("Settings saved!"); };
  const userInitials = user?.firstName ? `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase() : user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || "U";

  return (
    <div className="w-full min-h-full bg-background p-4 md:p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account preferences and integrations</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-muted/50 border border-border h-auto p-1 flex-wrap gap-1">
            <TabsTrigger value="profile" className="text-xs gap-1.5"><User className="w-3 h-3" />Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1.5"><Bell className="w-3 h-3" />Notifications</TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1.5"><Shield className="w-3 h-3" />Security</TabsTrigger>
            <TabsTrigger value="api" className="text-xs gap-1.5"><Key className="w-3 h-3" />API Keys</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs gap-1.5"><Palette className="w-3 h-3" />Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{user?.fullName || user?.primaryEmailAddress?.emailAddress || "User"}</p>
                    <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Verified</Badge>
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Pro Plan</Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-medium">First Name</Label>
                    <Input id="firstName" defaultValue={user?.firstName || ""} placeholder="First name" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-medium">Last Name</Label>
                    <Input id="lastName" defaultValue={user?.lastName || ""} placeholder="Last name" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
                  <div className="flex gap-2">
                    <Input id="email" defaultValue={user?.primaryEmailAddress?.emailAddress || ""} disabled className="h-9 text-sm bg-muted" />
                    <Badge className="self-center text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 whitespace-nowrap"><Check className="w-2.5 h-2.5 mr-1" />Verified</Badge>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Connected Accounts</CardTitle>
                <CardDescription>Link social accounts for faster sign-in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <ConnectedAccount provider="Google" icon={Chrome} connected={user?.externalAccounts?.some((a: any) => a.provider === "google") || false} email={user?.externalAccounts?.find((a: any) => a.provider === "google")?.emailAddress} onToggle={() => toast.info("Manage in your profile")} />
                <ConnectedAccount provider="Apple" icon={Apple} connected={user?.externalAccounts?.some((a: any) => a.provider === "apple") || false} onToggle={() => toast.info("Manage in your profile")} />
                <ConnectedAccount provider="Facebook" icon={Facebook} connected={user?.externalAccounts?.some((a: any) => a.provider === "facebook") || false} onToggle={() => toast.info("Manage in your profile")} />
                <ConnectedAccount provider="Twitter / X" icon={Twitter} connected={user?.externalAccounts?.some((a: any) => a.provider === "x") || false} onToggle={() => toast.info("Manage in your profile")} />
                <ConnectedAccount provider="Phone Number" icon={Smartphone} connected={(user?.phoneNumbers?.length || 0) > 0} email={user?.primaryPhoneNumber?.phoneNumber} onToggle={() => toast.info("Manage in your profile")} />
              </CardContent>
            </Card>

            <Card className="bg-card border border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Export Account Data</p>
                    <p className="text-xs text-muted-foreground">Download all your data in JSON format</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"><Download className="w-3 h-3" />Export</Button>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="font-semibold text-destructive text-sm">Delete Account</p>
                    <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" size="sm" className="gap-1.5 text-xs h-8"><Trash2 className="w-3 h-3" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 space-y-4">
            {[
              { title: "Email Notifications", icon: Bell, items: [{ key: "emailSignals", label: "New Trading Signals", desc: "Get notified when new signals are generated" }, { key: "emailWeeklyReport", label: "Weekly Performance Report", desc: "Receive your weekly analytics summary" }, { key: "emailMarketing", label: "Product Updates & News", desc: "Platform updates and new features" }] },
              { title: "Push Notifications", icon: Bell, items: [{ key: "pushSignals", label: "Signal Alerts", desc: "Real-time signal notifications in browser" }, { key: "pushPriceAlerts", label: "Price Alerts", desc: "When your set price targets are hit" }, { key: "pushSystemUpdates", label: "System Updates", desc: "Maintenance and system notifications" }] },
              { title: "SMS Notifications", icon: Smartphone, items: [{ key: "smsSignals", label: "Critical Signal Alerts", desc: "High-confidence signals via SMS" }, { key: "smsAlerts", label: "Price Target Alerts", desc: "Price alerts via text message" }] },
            ].map((section) => (
              <Card key={section.title} className="bg-card border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><section.icon className="w-4 h-4 text-primary" />{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                      <Switch checked={notifications[item.key as keyof typeof notifications]} onCheckedChange={(v) => setNotifications((p) => ({ ...p, [item.key]: v }))} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save Notification Settings"}
            </Button>
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-4">
            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Smartphone className="w-4 h-4 text-emerald-500" /></div>
                    <div><p className="font-semibold text-foreground text-sm">Authenticator App</p><p className="text-xs text-muted-foreground">Google Authenticator, Authy, etc.</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Enabled</Badge>
                    <Button variant="outline" size="sm" className="h-7 text-xs">Manage</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Sessions</CardTitle>
                <CardDescription>Devices currently signed in to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[{ device: "Chrome on macOS", location: "Dubai, UAE", current: true, lastActive: "Now" }, { device: "Safari on iPhone", location: "Dubai, UAE", current: false, lastActive: "2 hours ago" }, { device: "Firefox on Windows", location: "London, UK", current: false, lastActive: "3 days ago" }].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${session.current ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{session.device}</p>
                        <p className="text-xs text-muted-foreground">{session.location} · {session.lastActive}</p>
                      </div>
                    </div>
                    {session.current ? <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Current</Badge> : <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">Revoke</Button>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-4 space-y-4">
            <Alert className="bg-amber-500/5 border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm"><strong>Keep your API keys secret.</strong> Never share them publicly or in client-side code.</AlertDescription>
            </Alert>
            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-base">API Keys</CardTitle><CardDescription>Manage keys for programmatic access</CardDescription></div>
                  <Button size="sm" className="gap-1.5 text-xs" onClick={() => toast.info("Requires Pro plan or higher")}><Key className="w-3.5 h-3.5" />Generate Key</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ApiKeyItem name="Production API Key" keyValue="txr_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" createdAt="Jan 15, 2025" lastUsed="2 hours ago" onRevoke={() => toast.success("API key revoked")} />
                <ApiKeyItem name="Development API Key" keyValue="txr_test_sk_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4" createdAt="Feb 3, 2025" lastUsed="5 days ago" onRevoke={() => toast.success("API key revoked")} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-4 space-y-4">
            <Card className="bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4 text-primary" />Display & Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Theme", key: "theme", options: [{ value: "dark", label: "Dark (Recommended)" }, { value: "light", label: "Light" }, { value: "system", label: "System Default" }] },
                    { label: "Language", key: "language", options: [{ value: "en", label: "English" }, { value: "ar", label: "العربية" }, { value: "es", label: "Español" }, { value: "fr", label: "Français" }, { value: "zh", label: "中文" }] },
                    { label: "Default Currency", key: "currency", options: [{ value: "USD", label: "USD — US Dollar" }, { value: "EUR", label: "EUR — Euro" }, { value: "AED", label: "AED — UAE Dirham" }, { value: "SAR", label: "SAR — Saudi Riyal" }, { value: "BTC", label: "BTC — Bitcoin" }] },
                    { label: "Timezone", key: "timezone", options: [{ value: "UTC", label: "UTC" }, { value: "Asia/Dubai", label: "Asia/Dubai (UTC+4)" }, { value: "America/New_York", label: "New York (UTC-5)" }, { value: "Europe/London", label: "London (UTC+0)" }] },
                    { label: "Default Timeframe", key: "defaultTimeframe", options: ["1m","5m","15m","1H","4H","1D","1W"].map(v => ({ value: v, label: v })) },
                    { label: "Auto-Refresh Interval", key: "refreshInterval", options: [{ value: "10", label: "Every 10 seconds" }, { value: "30", label: "Every 30 seconds" }, { value: "60", label: "Every minute" }, { value: "0", label: "Manual only" }] },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs font-medium">{field.label}</Label>
                      <Select value={preferences[field.key as keyof typeof preferences] as string} onValueChange={(v) => setPreferences((p) => ({ ...p, [field.key]: v }))}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{field.options.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-4">
                  {[{ key: "compactMode", label: "Compact Mode", desc: "Reduce spacing for more data density" }, { key: "showPnlInPercent", label: "Show PnL in Percentage", desc: "Display profit/loss as % instead of absolute" }, { key: "autoRefresh", label: "Auto-Refresh Data", desc: "Automatically refresh signal data" }].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                      <Switch checked={preferences[item.key as keyof typeof preferences] as boolean} onCheckedChange={(v) => setPreferences((p) => ({ ...p, [item.key]: v }))} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
