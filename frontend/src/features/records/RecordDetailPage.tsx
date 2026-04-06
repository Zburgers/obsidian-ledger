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
}

export function RecordDetailPage({ recordId, onBack }: { recordId: string; onBack: () => void }) {
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const role = useAuthStore((s) => s.role);
  const canDelete = role === "admin";

  useEffect(() => {
    api.getRecord(recordId).then((data) => {
      setRecord(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [recordId]);

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    const confirmed = window.confirm("Soft delete this record?");
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await api.deleteRecord(recordId);
      onBack();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!record) return <p>Record not found</p>;

  return (
    <div className="grid">
      <div className="page-header">
        <h1 className="page-title">Record Detail</h1>
      </div>
      <section className="card">
        <dl className="description-list">
          <dt>Type</dt><dd>{record.record_type}</dd>
          <dt>Category</dt><dd>{record.category}</dd>
          <dt>Amount</dt><dd>{record.amount}</dd>
          <dt>Description</dt><dd>{record.description || "-"}</dd>
          <dt>Date</dt><dd>{new Date(record.recorded_at).toLocaleString()}</dd>
        </dl>
        {error && <p className="error">{error}</p>}
        <div className="actions" style={{ marginTop: "1rem" }}>
          {canDelete && (
            <button onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
          <button onClick={onBack}>Back</button>
        </div>
      </section>
    </div>
  );
}
