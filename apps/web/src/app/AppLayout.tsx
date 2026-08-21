import {
  Bot,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import { Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";

import ThemeToggle from "@/features/theme/ThemeToggle";
import { CommandPaletteProvider } from "@/features/command-palette";
import { useCommandPalette } from "@/features/command-palette/command-palette.hooks";
import { CommandShortcuts } from "@/features/command-palette/CommandShortcuts";
import {
  NotificationBell,
  NotificationDrawer,
  useNotificationEffects,
} from "@/features/notifications";
import RouteLoading from "@/app/RouteLoading";
import { env } from "@/shared/config/env";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/auth.context";
import SessionManager from "@/features/auth/session/SessionManager";
import { AetherMindLogo } from "@/shared/components/AetherMindLogo";

const mainNavigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Tasks", icon: CheckSquare, to: "/tasks" },
  { label: "Calendar", icon: CalendarDays, to: "/calendar" },
  { label: "AI Assistant", icon: Bot, to: "/assistant" },
];

const bottomNavigationItems = [
  { label: "Settings", icon: Settings, to: "/settings" },
];

function SidebarNavigation({
  items,
  ariaLabel = "Primary navigation",
}: {
  items: Array<{ label: string; icon: React.ComponentType<{ className?: string }>; to: string }>;
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="space-y-1.5">
      {items.map(({ label, icon: Icon, to }) => (
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
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/40">
        <AetherMindLogo size="md" />
      </div>
      <ScrollArea className="flex-1 px-4 py-6">
        <SidebarNavigation items={mainNavigationItems} />
      </ScrollArea>
      <div className="mt-auto shrink-0 border-t border-border/40 p-4">
        <SidebarNavigation items={bottomNavigationItems} ariaLabel="Secondary navigation" />
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "AM";

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
        <Button
          aria-label="Open account menu"
          className="rounded-full"
          size="icon"
          variant="ghost"
        >
          <Avatar className="size-8 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          {user ? `${user.firstName} ${user.lastName}` : "Account"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NavLink to="/settings">Settings</NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void logout();
          }}
          className="text-rose-600 focus:text-rose-600"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const IS_MAC = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

function CommandPaletteSearchButton() {
  const { open } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search commands"
      className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <Search className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">
        Search {env.appName}…
      </span>
      <CommandShortcuts keys={[IS_MAC ? "⌘" : "Ctrl", "K"]} />
    </button>
  );
}

function AppLayout() {
  useNotificationEffects();

  return (
    <CommandPaletteProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-card lg:block">
          <Sidebar />
        </aside>

        <div className="lg:pl-64 flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:gap-4 sm:px-6">
            <div className="flex items-center gap-2.5 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    aria-label="Open navigation"
                    className="size-9 shrink-0"
                    size="icon"
                    variant="outline"
                  >
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="p-0" side="left">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <Sidebar />
                </SheetContent>
              </Sheet>

              <AetherMindLogo size="sm" textClassName="hidden sm:inline-block" />
            </div>

            <div className="max-w-md flex-1">
              <CommandPaletteSearchButton />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge
                variant="outline"
                className="h-5 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider rounded-full border-primary/25 bg-primary/10 text-primary select-none cursor-default"
                title="AetherMind is currently in beta"
                aria-label="AetherMind is currently in beta"
              >
                BETA
              </Badge>
              <NotificationDrawer>
                <NotificationBell />
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
        <SessionManager />
      </div>
    </CommandPaletteProvider>
  );
}

export default AppLayout;
