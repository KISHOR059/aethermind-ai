import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/app/AppLayout";
import RequireAuth from "@/features/auth/components/RequireAuth";
import RouteLoading from "@/app/RouteLoading";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const AssistantPage = lazy(() => import("@/pages/AssistantPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
