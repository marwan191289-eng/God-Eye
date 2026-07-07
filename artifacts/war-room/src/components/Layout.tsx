import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard, BarChart2, Settings, CreditCard, Code2,
  LogOut, Menu, X, ChevronRight, Shield, Bell, Sun, Moon,
  TrendingUp, Zap, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Nav Items ────────────────────────────────────────────────────────────────
const navItems = [
  { path: "/", label: "War Room", icon: TrendingUp, badge: "LIVE" },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/api-docs", label: "API Docs", icon: Code2 },
];

const adminItems = [
  { path: "/admin", label: "Admin Panel", icon: Shield },
];

// ─── Sidebar Nav Link ─────────────────────────────────────────────────────────
const NavItem = ({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  onClick?: () => void;
}) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
        isActive
          ? "bg-sidebar-accent text-primary font-semibold"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70")} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider animate-pulse">
          {item.badge}
        </span>
      )}
      {isActive && <ChevronRight className="w-3 h-3 text-primary/50" />}
    </Link>
  );
};

// ─── Layout Component ─────────────────────────────────────────────────────────
interface LayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export const Layout = ({ children, isAdmin = false }: LayoutProps) => {
  const location = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const userInitials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase()
    : user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <span className="font-bold text-sidebar-foreground text-sm tracking-tight">TradeXRay AI</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary/70 font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest px-3 mb-2">
          Platform
        </p>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={() => setSidebarOpen(false)}
          />
        ))}

        {isAdmin && (
          <>
            <p className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest px-3 mt-4 mb-2">
              Admin
            </p>
            {adminItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={location.pathname === item.path}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-sidebar-accent/60 transition-colors group">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">
                  {user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/40 truncate">
                  {user?.primaryEmailAddress?.emailAddress || ""}
                </p>
              </div>
              <ChevronRight className="w-3 h-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52 mb-1">
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/subscriptions" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="w-4 h-4" />
                Subscription
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleDarkMode} className="flex items-center gap-2 cursor-pointer">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar (Mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">TradeXRay AI</span>
          </div>
          <Avatar className="w-7 h-7">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
