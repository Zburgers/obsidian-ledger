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

  if (loading) return <p>Loading users...</p>;
  if (error) return <p className="error">{error}</p>;

  const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
    acc[user.role] = (acc[user.role] ?? 0) + 1;
    return acc;
  }, {});
  const activeCount = users.filter((user) => user.is_active).length;
  const inactiveCount = users.length - activeCount;
  const roleEntries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
  const maxRoleCount = Math.max(...roleEntries.map(([, count]) => count), 1);

  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="muted">Manage account status for your organization.</p>
        </div>
      </div>

      <section className="card">
        <h2>Team Insights</h2>
        <div className="grid cols-4">
          <article className="kpi-card records">
            <div className="muted">Total users</div>
            <p className="metric-value">{users.length}</p>
          </article>
          <article className="kpi-card income">
            <div className="muted">Active users</div>
            <p className="metric-value">{activeCount}</p>
          </article>
          <article className="kpi-card expense">
            <div className="muted">Inactive users</div>
            <p className="metric-value">{inactiveCount}</p>
          </article>
          <article className="kpi-card net">
            <div className="muted">Role types</div>
            <p className="metric-value">{roleEntries.length}</p>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Role Distribution</h2>
        <div className="category-bars" aria-label="Role distribution chart">
          {roleEntries.map(([role, count]) => (
            <div key={role} className="category-row">
              <div className="category-title">
                <span>{role}</span>
                <span>{count} users</span>
              </div>
              <div className="bar-track" aria-hidden="true">
                <div className="bar-fill" style={{ width: `${(count / maxRoleCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card" aria-label="Users table">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.name || "-"}</td>
                  <td><span className="role-chip">{u.role}</span></td>
                  <td>
                    <span className={`status-dot ${u.is_active ? "active" : "inactive"}`} />
                    {u.is_active ? "Yes" : "No"}
                  </td>
                  <td>
                    <button className={u.is_active ? "btn-danger" : "btn-primary"} onClick={() => handleToggleActive(u)}>
                      {u.is_active ? "Deactivate" : "Activate"}
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
