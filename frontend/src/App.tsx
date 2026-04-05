import { Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { UsersPage } from "./features/users/UsersPage";
import { RecordsPage } from "./features/records/RecordsPage";
import { RecordForm } from "./features/records/RecordForm";
import { RecordDetailPage } from "./features/records/RecordDetailPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { LandingPage } from "./features/landing/LandingPage";
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from "./router";
import { useState, useCallback, type ReactNode } from "react";
import { useAuthStore } from "./features/auth/authStore";

/* ─────────────────────────────────────────────────────────────
   Line-art SVG Icons (stroke-based, 20x20)
───────────────────────────────────────────────────────────── */
const Icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </svg>
  ),
  records: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12c1 0 1.5.5 1.5 1.5v9c0 1-.5 1.5-1.5 1.5H4c-1 0-1.5-.5-1.5-1.5v-9C2.5 4.5 3 4 4 4z" />
      <path d="M6 8h8M6 11h5" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6" r="3" />
      <path d="M4 17c0-3 2.5-5 6-5s6 2 6 5" />
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 15H4a1 1 0 01-1-1V4a1 1 0 011-1h2M12 12l3-3-3-3M7 9h8" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   Page Title Mapping
───────────────────────────────────────────────────────────── */
function getPageMeta(pathname: string): { title: string; subtitle: string } {
  if (pathname.startsWith("/dashboard")) return { title: "Dashboard", subtitle: "Financial overview and insights" };
  if (pathname.startsWith("/records")) return { title: "Records", subtitle: "Transaction history and management" };
  if (pathname.startsWith("/users")) return { title: "Users", subtitle: "Team access and role management" };
  return { title: "FinTrack", subtitle: "Business finance control center" };
}

/* ─────────────────────────────────────────────────────────────
   Avatar Component
───────────────────────────────────────────────────────────── */
function Avatar({ email }: { email: string | null }) {
  const initials = email ? email.slice(0, 2).toUpperCase() : "??";
  return (
    <div className="avatar" aria-label={`User avatar for ${email ?? "unknown"}`}>
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   App Layout with Glassmorphic Sidebar + Topbar
───────────────────────────────────────────────────────────── */
function AppLayout({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.role);
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageMeta = getPageMeta(location.pathname);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: Icons.dashboard },
    { to: "/records", label: "Records", icon: Icons.records },
    ...(role === "admin" ? [{ to: "/users", label: "Users", icon: Icons.users }] : []),
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? "sidebar--open" : ""}`} aria-label="Primary navigation">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-icon">◆</span>
            FinTrack
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            {Icons.close}
          </button>
        </div>
        <p className="muted sidebar-copy">Business finance control center</p>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={handleNavClick}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar email={email} />
            <div className="sidebar-user-info">
              <span className="sidebar-user-email">{email ?? "User"}</span>
              {role && <span className="role-chip">{role}</span>}
            </div>
          </div>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar" aria-label="Page header">
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            {Icons.menu}
          </button>

          <div className="topbar-title-group">
            <h1 className="topbar-title">{pageMeta.title}</h1>
            <p className="topbar-subtitle muted">{pageMeta.subtitle}</p>
          </div>

          <div className="topbar-right">
            <div className="topbar-user">
              <Avatar email={email} />
              <div className="topbar-user-info">
                <span className="topbar-user-email">{email ?? "Signed in"}</span>
                {role && <span className="role-chip">{role}</span>}
              </div>
            </div>
            <button type="button" onClick={logout} className="btn-ghost btn-logout">
              {Icons.logout}
              <span>Logout</span>
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
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />
      
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
