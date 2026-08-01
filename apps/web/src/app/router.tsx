import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/app/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import NotFoundPage from "@/pages/NotFoundPage";
import SettingsPage from "@/pages/SettingsPage";
import TasksPage from "@/pages/TasksPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
