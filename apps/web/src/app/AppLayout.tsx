import {
  Bot,
  CheckSquare,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";

import ThemeToggle from "@/features/theme/ThemeToggle";
import { NotificationBell, NotificationDrawer, useNotificationEffects } from "@/features/notifications";
import RouteLoading from "@/app/RouteLoading";
import { env } from "@/shared/config/env";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/auth.context";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Tasks", icon: CheckSquare, to: "/tasks" },
  { label: "AI Assistant", icon: Bot, to: "/assistant" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

function SidebarNavigation() {
  return (
    <nav aria-label="Primary navigation" className="space-y-1.5">
      {navigationItems.map(({ label, icon: Icon, to }) => (
        <NavLink
          key={label}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground",
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Sidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border/40">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-4" />
        </div>
        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          {env.appName}
        </span>
      </div>
      <ScrollArea className="flex-1 px-4 py-6">
        <SidebarNavigation />
      </ScrollArea>
    </div>
  );
}

function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const initials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() : "AM";

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <NavLink to="/login">Login</NavLink>
        </Button>
        <Button asChild size="sm">
          <NavLink to="/register">Register</NavLink>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Open account menu" className="rounded-full" size="icon" variant="ghost">
          <Avatar className="size-8 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{user ? `${user.firstName} ${user.lastName}` : "Account"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NavLink to="/settings">Settings</NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { void logout(); }} className="text-rose-600 focus:text-rose-600">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppLayout() {
  useNotificationEffects();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-card lg:block">
        <Sidebar />
      </aside>

      <div className="lg:pl-64 flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button aria-label="Open navigation" className="lg:hidden" size="icon" variant="outline">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="p-0" side="left">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input className="pl-9 h-9 text-xs" placeholder={`Search ${env.appName}...`} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationDrawer>
              <NotificationBell onClick={() => {}} />
            </NotificationDrawer>
            <ThemeToggle />
            <Separator orientation="vertical" className="h-6" />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <Suspense fallback={<RouteLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
