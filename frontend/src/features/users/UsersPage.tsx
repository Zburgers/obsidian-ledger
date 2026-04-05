import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  is_deleted: boolean;
}

// Role colors for donut chart
const ROLE_COLORS: Record<string, string> = {
  admin: "#F43F5E",    // Electric Rose
  analyst: "#3B82F6",  // Cyber Blue
  viewer: "#10B981",   // Mint/Emerald
};

function getRoleColor(role: string): string {
  return ROLE_COLORS[role.toLowerCase()] ?? "#8B5CF6"; // Fallback: Purple
}

// SVG Donut Chart for Role Distribution
function RoleDonut({ roleEntries, total }: { roleEntries: [string, number][]; total: number }) {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativePercent = 0;

  return (
    <div className="donut-chart-container">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="donut-chart"
        aria-label="Role distribution donut chart"
      >
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--surface-elevated)"
          strokeWidth={strokeWidth}
        />
        {/* Role segments */}
        {roleEntries.map(([role, count]) => {
          const percent = count / total;
          const offset = circumference * (1 - percent);
          const rotation = cumulativePercent * 360 - 90;
          cumulativePercent += percent;

          return (
            <circle
              key={role}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={getRoleColor(role)}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${center} ${center})`}
              className="donut-segment"
            />
          );
        })}
        {/* Center text */}
        <text x={center} y={center - 8} textAnchor="middle" className="donut-center-value">
          {total}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" className="donut-center-label">
          users
        </text>
      </svg>

      {/* Legend */}
      <div className="donut-legend">
        {roleEntries.map(([role, count]) => (
          <div key={role} className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: getRoleColor(role) }}
            />
            <span className="legend-label">{role}</span>
            <span className="legend-value">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// User icon SVG
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// Shield icon for admins
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// Chart icon for analysts
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

// Eye icon for viewers
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function getRoleIcon(role: string) {
  switch (role.toLowerCase()) {
    case "admin":
      return <ShieldIcon className="role-icon" />;
    case "analyst":
      return <ChartIcon className="role-icon" />;
    default:
      return <EyeIcon className="role-icon" />;
  }
}

export function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.listUsers();
      setUsers(data.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleToggleActive(user: UserItem) {
    try {
      await api.updateUser(user.id, { is_active: !user.is_active });
      fetchUsers();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="error">{error}</p>
      </div>
    );
  }

  const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
    acc[user.role] = (acc[user.role] ?? 0) + 1;
    return acc;
  }, {});
  const activeCount = users.filter((user) => user.is_active).length;
  const inactiveCount = users.length - activeCount;
  const roleEntries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="users-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage account status for your organization.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <UserIcon />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="kpi-row">
        <article className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Users</span>
            <span className="kpi-icon neutral">
              <UserIcon />
            </span>
          </div>
          <p className="kpi-value">{users.length}</p>
          <p className="kpi-subtitle">Across all roles</p>
        </article>

        <article className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Active</span>
            <span className="kpi-icon positive">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </div>
          <p className="kpi-value positive">{activeCount}</p>
          <p className="kpi-subtitle">
            {users.length > 0 ? `${((activeCount / users.length) * 100).toFixed(0)}% of team` : "—"}
          </p>
        </article>

        <article className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Inactive</span>
            <span className="kpi-icon negative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </span>
          </div>
          <p className="kpi-value negative">{inactiveCount}</p>
          <p className="kpi-subtitle">
            {users.length > 0 ? `${((inactiveCount / users.length) * 100).toFixed(0)}% of team` : "—"}
          </p>
        </article>

        <article className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Role Types</span>
            <span className="kpi-icon accent">
              <ShieldIcon />
            </span>
          </div>
          <p className="kpi-value">{roleEntries.length}</p>
          <p className="kpi-subtitle">Permission levels</p>
        </article>
      </div>

      {/* Role Distribution Chart */}
      <section className="card chart-card">
        <div className="card-header">
          <h2>Role Distribution</h2>
          <p className="muted">Team composition by permission level</p>
        </div>
        <RoleDonut roleEntries={roleEntries} total={users.length} />
      </section>

      {/* Users Table */}
      <section className="card" aria-label="Users table">
        <div className="card-header">
          <h2>All Users</h2>
          <p className="muted">{users.length} members in your organization</p>
        </div>
        <div className="table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.is_active ? "inactive-row" : ""}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar" style={{ backgroundColor: getRoleColor(u.role) }}>
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{u.name || "—"}</span>
                        <span className="user-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="role-chip"
                      style={{
                        backgroundColor: `${getRoleColor(u.role)}20`,
                        color: getRoleColor(u.role),
                        borderColor: `${getRoleColor(u.role)}40`,
                      }}
                    >
                      {getRoleIcon(u.role)}
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${u.is_active ? "active" : "inactive"}`}>
                      <span className="status-dot" />
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="actions-col">
                    <button
                      className={u.is_active ? "btn-ghost-danger" : "btn-ghost-success"}
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.is_active ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
