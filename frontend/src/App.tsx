import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { UsersPage } from "./features/users/UsersPage";
import { RecordsPage } from "./features/records/RecordsPage";
import { RecordForm } from "./features/records/RecordForm";
import { RecordDetailPage } from "./features/records/RecordDetailPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from "./router";
import { useState, useCallback, type ReactNode } from "react";
import { useAuthStore } from "./features/auth/authStore";

function AppLayout({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.role);
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/records", label: "Records" },
    ...(role === "admin" ? [{ to: "/users", label: "Users" }] : []),
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">FinTrack</div>
        <p className="muted sidebar-copy">Business finance control center</p>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar" aria-label="User context">
          <div className="topbar-title-group">
            <p className="topbar-kicker">Finance Workspace</p>
            <p className="muted">Live records, user management, and exports</p>
          </div>
          <div className="topbar-right">
            {role && <span className="role-chip">{role}</span>}
            <span>{email ?? "Signed in"}</span>
            <button type="button" onClick={logout} className="btn-ghost">
              Logout
            </button>
          </div>
        </header>
        <main className="page-wrap">{children}</main>
      </div>
    </div>
  );
}

export function App() {
  const role = useAuthStore((s) => s.role);
  const canCreateRecords = role === "admin";
  const [recordsView, setRecordsView] = useState<"list" | "create" | "detail">("list");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const handleViewRecord = useCallback((id: string) => {
    setSelectedRecordId(id);
    setRecordsView("detail");
  }, []);

  const handleCreateRecord = useCallback(() => {
    setRecordsView("create");
  }, []);

  const handleBackToList = useCallback(() => {
    setRecordsView("list");
    setSelectedRecordId(null);
  }, []);

  const handleRecordSuccess = useCallback(() => {
    setRecordsView("list");
    setSelectedRecordId(null);
  }, []);

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/records" element={
          <AppLayout>
            {recordsView === "list" ? (
              <RecordsPage onCreate={canCreateRecords ? handleCreateRecord : undefined} onView={handleViewRecord} />
            ) : recordsView === "create" && canCreateRecords ? (
              <RecordForm onSuccess={handleRecordSuccess} onCancel={handleBackToList} />
            ) : selectedRecordId ? (
              <RecordDetailPage recordId={selectedRecordId} onBack={handleBackToList} />
            ) : null}
          </AppLayout>
        } />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/users" element={<AppLayout><UsersPage /></AppLayout>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
