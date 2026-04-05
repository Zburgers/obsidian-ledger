import { useState, type FormEvent } from "react";
import { api } from "../../lib/api";

interface RecordFormProps {
  recordId?: string;
  initialData?: { record_type: string; category: string; amount: string; description?: string };
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecordForm({ recordId, initialData, onSuccess, onCancel }: RecordFormProps) {
  const [recordType, setRecordType] = useState(initialData?.record_type || "expense");
  const [category, setCategory] = useState(initialData?.category || "");
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (recordId) {
        await api.updateRecord(recordId, { record_type: recordType, category, amount: amount as unknown as number, description });
      } else {
        await api.createRecord({ record_type: recordType, category, amount: amount as unknown as number, description: description || undefined });
      }
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="grid">
      <div className="page-header">
        <h1 className="page-title">{recordId ? "Edit Record" : "New Record"}</h1>
      </div>
      <section className="card">
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
          <label htmlFor="record_type">Type</label>
          <select id="record_type" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          </div>
          <div className="field">
          <label htmlFor="category">Category</label>
          <input id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
          </div>
          <div className="field">
          <label htmlFor="amount">Amount</label>
          <input id="amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="field">
          <label htmlFor="description">Description</label>
          <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="actions">
            <button className="btn-primary" type="submit">{recordId ? "Update" : "Create"}</button>
            <button type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </section>
    </div>
  );
}
