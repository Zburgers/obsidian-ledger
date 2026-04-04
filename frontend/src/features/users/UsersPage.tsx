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
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1>Users</h1>
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
              <td>{u.role}</td>
              <td>{u.is_active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => handleToggleActive(u)}>
                  {u.is_active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
