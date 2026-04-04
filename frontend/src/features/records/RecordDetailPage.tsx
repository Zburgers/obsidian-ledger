import { useState, useEffect } from "react";
import { api } from "../../lib/api";

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

  useEffect(() => {
    api.getRecord(recordId).then((data) => {
      setRecord(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [recordId]);

  if (loading) return <p>Loading...</p>;
  if (!record) return <p>Record not found</p>;

  return (
    <div>
      <h1>Record Detail</h1>
      <dl>
        <dt>Type</dt><dd>{record.record_type}</dd>
        <dt>Category</dt><dd>{record.category}</dd>
        <dt>Amount</dt><dd>{record.amount}</dd>
        <dt>Description</dt><dd>{record.description || "-"}</dd>
        <dt>Date</dt><dd>{new Date(record.recorded_at).toLocaleString()}</dd>
      </dl>
      <button onClick={onBack}>Back</button>
    </div>
  );
}
