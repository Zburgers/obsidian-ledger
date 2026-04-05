import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../auth/authStore";

interface FinanceRecord {
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
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const role = useAuthStore((s) => s.role);
  const canUseAdvancedFilters = role === "analyst" || role === "admin";

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "20" });
      if (filterType) params.set("type", filterType);
      if (filterCategory) params.set("category", filterCategory);
      if (filterFrom) params.set("date_from", filterFrom);
      if (filterTo) params.set("date_to", filterTo);
      if (canUseAdvancedFilters && search) params.set("search", search);
      if (canUseAdvancedFilters && amountMin) params.set("amount_min", amountMin);
      if (canUseAdvancedFilters && amountMax) params.set("amount_max", amountMax);
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
  }, [
    page,
    filterType,
    filterCategory,
    filterFrom,
    filterTo,
    search,
    amountMin,
    amountMax,
    canUseAdvancedFilters,
  ]);

  const incomeRecords = records.filter((r) => r.record_type === "income");
  const expenseRecords = records.filter((r) => r.record_type === "expense");
  const incomeTotal = incomeRecords.reduce((sum, r) => sum + Number.parseFloat(r.amount || "0"), 0);
  const expenseTotal = expenseRecords.reduce((sum, r) => sum + Number.parseFloat(r.amount || "0"), 0);
  const netTotal = incomeTotal - expenseTotal;

  const categoryTotals = records.reduce<{ [key: string]: number }>((acc, record) => {
    const amount = Number.parseFloat(record.amount || "0");
    acc[record.category] = (acc[record.category] ?? 0) + amount;
    return acc;
  }, {});
  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const totalCategoryAmount = categoryEntries.reduce((sum, [, value]) => sum + value, 0);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  if (loading) return <p>Loading records...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <h1 className="page-title">Records</h1>
          <p className="muted">Track, filter, and export financial records.</p>
        </div>
        <div className="actions">
          {onCreate && <button className="btn-primary" onClick={onCreate}>New Record</button>}
          <button onClick={() => handleExport("csv")}>Export CSV</button>
          <button onClick={() => handleExport("pdf")}>Export PDF</button>
        </div>
      </div>

      <section className="card">
        <h2>Filters</h2>
        <div className="grid cols-3">
          <div className="field">
            <label htmlFor="type-filter">Type</label>
            <select id="type-filter" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="category-filter">Category</label>
            <input
              id="category-filter"
              placeholder="Filter by category"
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            />
          </div>
          {canUseAdvancedFilters ? (
            <div className="field">
              <label htmlFor="search-filter">Search</label>
              <input
                id="search-filter"
                placeholder="Search notes/category"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="from-filter">Date from</label>
            <input
              id="from-filter"
              type="date"
              value={filterFrom}
              onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div className="field">
            <label htmlFor="to-filter">Date to</label>
            <input
              id="to-filter"
              type="date"
              value={filterTo}
              onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
            />
          </div>
          <div className="field">
            <label htmlFor="records-count">Result count</label>
            <input id="records-count" value={`${total} records`} readOnly aria-readonly="true" />
          </div>
          {canUseAdvancedFilters ? (
            <>
              <div className="field">
                <label htmlFor="amount-min-filter">Amount min</label>
                <input
                  id="amount-min-filter"
                  type="number"
                  step="0.01"
                  value={amountMin}
                  onChange={(e) => { setAmountMin(e.target.value); setPage(1); }}
                />
              </div>
              <div className="field">
                <label htmlFor="amount-max-filter">Amount max</label>
                <input
                  id="amount-max-filter"
                  type="number"
                  step="0.01"
                  value={amountMax}
                  onChange={(e) => { setAmountMax(e.target.value); setPage(1); }}
                />
              </div>
            </>
          ) : null}
          <div className="field">
            <label htmlFor="active-filters">Active filters</label>
            <input
              id="active-filters"
              value={[
                filterType && `type=${filterType}`,
                filterCategory && `category=${filterCategory}`,
                canUseAdvancedFilters && search && `search=${search}`,
                canUseAdvancedFilters && amountMin && `amount_min=${amountMin}`,
                canUseAdvancedFilters && amountMax && `amount_max=${amountMax}`,
                filterFrom && `date_from=${filterFrom}`,
                filterTo && `date_to=${filterTo}`,
              ].filter(Boolean).join(" | ") || "none"}
              readOnly
              aria-readonly="true"
            />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Record Insights</h2>
        <div className="grid cols-4">
          <article className="kpi-card income">
            <div className="muted">Income in page</div>
            <p className="metric-value">{formatMoney(incomeTotal)}</p>
          </article>
          <article className="kpi-card expense">
            <div className="muted">Expense in page</div>
            <p className="metric-value">{formatMoney(expenseTotal)}</p>
          </article>
          <article className="kpi-card net">
            <div className="muted">Net in page</div>
            <p className="metric-value">{formatMoney(netTotal)}</p>
          </article>
          <article className="kpi-card records">
            <div className="muted">Transactions shown</div>
            <p className="metric-value">{records.length}</p>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Top Categories</h2>
        <div className="category-bars" aria-label="Top categories chart">
          {categoryEntries.length === 0 && <p className="muted">No records in this page yet.</p>}
          {categoryEntries.map(([category, amount]) => {
            const width = totalCategoryAmount > 0 ? Math.max((amount / totalCategoryAmount) * 100, 4) : 4;
            return (
              <div key={category} className="category-row">
                <div className="category-title">
                  <span>{category}</span>
                  <span>{formatMoney(amount)}</span>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <div className="bar-fill" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card" aria-label="Records table">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className={`type-pill ${r.record_type}`}>{r.record_type}</span>
                  </td>
                  <td>{r.category}</td>
                  <td>{r.amount}</td>
                  <td className="truncate-cell">{r.description || "-"}</td>
                  <td>{new Date(r.recorded_at).toLocaleDateString()}</td>
                  <td>
                    {onView && <button onClick={() => onView(r.id)}>View</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="actions">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span className="muted">Page {page} of {Math.ceil(total / 20) || 1}</span>
        <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
