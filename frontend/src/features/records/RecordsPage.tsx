import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../auth/authStore";

interface Record {
  id: string;
  user_id: string;
  record_type: string;
  category: string;
  amount: string;
  description: string | null;
  recorded_at: string;
  is_deleted: boolean;
}

interface RecordsPageProps {
  onCreate?: () => void;
  onView?: (id: string) => void;
}

export function RecordsPage({ onCreate, onView }: RecordsPageProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "20" });
      if (filterType) params.set("type", filterType);
      if (filterCategory) params.set("category", filterCategory);
      const data = await api.listRecords(params.toString());
      setRecords(data.items);
      setTotal(data.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "pdf") => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    const ext = format === "csv" ? "csv" : "pdf";
    const res = await fetch(`/api/v1/export/${ext}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `records.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchRecords();
  }, [page, filterType, filterCategory]);

  if (loading) return <p>Loading records...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1>Records</h1>
      <div>
        {onCreate && <button onClick={onCreate}>New Record</button>}
        <button onClick={() => handleExport("csv")}>Export CSV</button>
        <button onClick={() => handleExport("pdf")}>Export PDF</button>
      </div>
      <div>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          placeholder="Filter by category"
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{r.record_type}</td>
              <td>{r.category}</td>
              <td>{r.amount}</td>
              <td>{r.description || "-"}</td>
              <td>{new Date(r.recorded_at).toLocaleDateString()}</td>
              <td>
                {onView && <button onClick={() => onView(r.id)}>View</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span> Page {page} of {Math.ceil(total / 20) || 1} </span>
        <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
