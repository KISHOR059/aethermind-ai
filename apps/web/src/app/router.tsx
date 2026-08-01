import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/app/AppLayout";
import RouteLoading from "@/app/RouteLoading";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/not-found" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
