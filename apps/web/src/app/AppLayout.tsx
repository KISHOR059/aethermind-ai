import {
  CheckSquare,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import { Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";

import ThemeToggle from "@/features/theme/ThemeToggle";
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

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Tasks", icon: CheckSquare, to: "/tasks" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

function SidebarNavigation() {
  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navigationItems.map(({ label, icon: Icon, to }) => (
        <NavLink
          key={label}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Sidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          A
        </div>
        <span className="text-lg font-semibold tracking-tight">{env.appName}</span>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-4 py-6">
        <SidebarNavigation />
      </ScrollArea>
    </div>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Open account menu" className="rounded-full" size="icon" variant="ghost">
          <Avatar className="size-8">
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-card lg:block">
        <Sidebar />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button aria-label="Open navigation" className="lg:hidden" size="icon" variant="outline">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent className="p-0" side="left">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input className="pl-9" placeholder={`Search ${env.appName}...`} />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<RouteLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
