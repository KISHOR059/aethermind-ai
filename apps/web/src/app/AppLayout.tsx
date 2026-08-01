import { NavLink, Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white p-6">
        <p className="text-lg font-semibold">Sidebar</p>
        <nav aria-label="Primary navigation" className="mt-6 space-y-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm ${
                isActive
                  ? "bg-slate-100 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm ${
                isActive
                  ? "bg-slate-100 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            Settings
          </NavLink>
        </nav>
      </aside>

      <div className="pl-64">
        <header className="flex h-16 items-center border-b border-slate-200 bg-white px-8">
          <p className="text-sm font-medium text-slate-600">Navbar</p>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
