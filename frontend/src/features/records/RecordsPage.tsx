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

/* ─────────────────────────────────────────────────────────────
   Transaction Arrow Icon
───────────────────────────────────────────────────────────── */
function TransactionArrow({ type }: { type: string }) {
  const isIncome = type.toLowerCase() === "income";
  return (
    <span className={`type-arrow ${isIncome ? "income" : "expense"}`} aria-label={type}>
      {isIncome ? "↓" : "↑"}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Filter Chip Component
───────────────────────────────────────────────────────────── */
function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="filter-chip">
      {label}
      <button type="button" onClick={onClear} aria-label={`Clear ${label} filter`}>×</button>
    </span>
  );
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
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setFilterType("");
    setFilterCategory("");
    setFilterFrom("");
    setFilterTo("");
    setSearch("");
    setAmountMin("");
    setAmountMax("");
    setPage(1);
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

  const hasActiveFilters = filterType || filterCategory || filterFrom || filterTo || search || amountMin || amountMax;
  const totalPages = Math.ceil(total / 20) || 1;

  if (loading && records.length === 0) return <p className="muted">Loading records...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="records-layout">
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Records</h1>
          <p className="muted">Track, filter, and export financial transactions</p>
        </div>
        <div className="actions">
          {onCreate && <button className="btn-primary" onClick={onCreate}>+ New Record</button>}
          <button onClick={() => handleExport("csv")}>CSV</button>
          <button onClick={() => handleExport("pdf")}>PDF</button>
        </div>
      </div>

      {/* ─── Glassmorphic Insights Row ─── */}
      <section className="insights-glass reveal" aria-label="Page insights">
        <article className="insight-mini income">
          <span className="insight-icon">↓</span>
          <div>
            <span className="insight-value">{formatMoney(incomeTotal)}</span>
            <span className="insight-label">Income</span>
          </div>
        </article>
        <article className="insight-mini expense">
          <span className="insight-icon">↑</span>
          <div>
            <span className="insight-value">{formatMoney(expenseTotal)}</span>
            <span className="insight-label">Expenses</span>
          </div>
        </article>
        <article className="insight-mini net">
          <span className="insight-icon">=</span>
          <div>
            <span className={`insight-value ${netTotal >= 0 ? "positive" : "negative"}`}>
              {formatMoney(netTotal)}
            </span>
            <span className="insight-label">Net</span>
          </div>
        </article>
        <article className="insight-mini count">
          <span className="insight-icon">#</span>
          <div>
            <span className="insight-value">{total}</span>
            <span className="insight-label">Total Records</span>
          </div>
        </article>
      </section>

      {/* ─── Streamlined Filter Row ─── */}
      <section className="filter-row reveal" aria-label="Filters">
        <div className="filter-row-main">
          <select 
            value={filterType} 
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <input
            type="text"
            placeholder="Category..."
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            aria-label="Filter by category"
          />

          {canUseAdvancedFilters && (
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search records"
            />
          )}

          <div className="filter-date-group">
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
              aria-label="Date from"
            />
            <span className="filter-date-sep">→</span>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
              aria-label="Date to"
            />
          </div>

          {canUseAdvancedFilters && (
            <div className="filter-amount-group">
              <input
                type="number"
                placeholder="Min $"
                value={amountMin}
                onChange={(e) => { setAmountMin(e.target.value); setPage(1); }}
                aria-label="Minimum amount"
              />
              <input
                type="number"
                placeholder="Max $"
                value={amountMax}
                onChange={(e) => { setAmountMax(e.target.value); setPage(1); }}
                aria-label="Maximum amount"
              />
            </div>
          )}

          {hasActiveFilters && (
            <button className="btn-ghost filter-clear-btn" onClick={clearAllFilters}>
              Clear All
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="filter-chips">
            {filterType && <FilterChip label={`Type: ${filterType}`} onClear={() => setFilterType("")} />}
            {filterCategory && <FilterChip label={`Category: ${filterCategory}`} onClear={() => setFilterCategory("")} />}
            {search && <FilterChip label={`Search: ${search}`} onClear={() => setSearch("")} />}
            {filterFrom && <FilterChip label={`From: ${filterFrom}`} onClear={() => setFilterFrom("")} />}
            {filterTo && <FilterChip label={`To: ${filterTo}`} onClear={() => setFilterTo("")} />}
            {amountMin && <FilterChip label={`Min: $${amountMin}`} onClear={() => setAmountMin("")} />}
            {amountMax && <FilterChip label={`Max: $${amountMax}`} onClear={() => setAmountMax("")} />}
          </div>
        )}
      </section>

      {/* ─── Category Breakdown (Compact) ─── */}
      {categoryEntries.length > 0 && (
        <section className="card reveal compact-categories" aria-label="Top categories">
          <div className="compact-categories-header">
            <h2>Top Categories</h2>
            <span className="muted">{records.length} transactions on this page</span>
          </div>
          <div className="category-bars-horizontal">
            {categoryEntries.map(([category, amount]) => {
              const width = totalCategoryAmount > 0 ? Math.max((amount / totalCategoryAmount) * 100, 4) : 4;
              return (
                <div key={category} className="category-bar-h">
                  <span className="category-bar-label">{category}</span>
                  <div className="category-bar-track">
                    <div className="bar-fill" style={{ width: `${width}%` }} />
                  </div>
                  <span className="category-bar-amount">{formatMoney(amount)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Records Table ─── */}
      <section className="card reveal" aria-label="Records table">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th className="hide-mobile">Notes</th>
                <th>Date</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                    No records found. {hasActiveFilters && "Try adjusting your filters."}
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} onClick={() => onView?.(r.id)}>
                    <td>
                      <TransactionArrow type={r.record_type} />
                    </td>
                    <td className="cell-category">{r.category}</td>
                    <td className={`cell-amount ${r.record_type}`}>
                      {r.record_type === "income" ? "+" : "-"}${r.amount}
                    </td>
                    <td className="truncate-cell hide-mobile">{r.description || "—"}</td>
                    <td className="cell-date">
                      {new Date(r.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </td>
                    <td>
                      {onView && (
                        <button 
                          className="btn-ghost btn-view"
                          onClick={(e) => { e.stopPropagation(); onView(r.id); }}
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Pagination ─── */}
      <nav className="pagination" aria-label="Records pagination">
        <button 
          className="btn-ghost" 
          disabled={page <= 1} 
          onClick={() => setPage(page - 1)}
        >
          ← Previous
        </button>
        <span className="pagination-info">
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </span>
        <button 
          className="btn-ghost" 
          disabled={page >= totalPages} 
          onClick={() => setPage(page + 1)}
        >
          Next →
        </button>
      </nav>
    </div>
  );
}
