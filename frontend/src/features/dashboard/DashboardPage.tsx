import { useState, useEffect } from "react";
import { api } from "../../lib/api";

interface Summary {
  total_income: string;
  total_expense: string;
  net: string;
  record_count: number;
}

interface CategoryItem {
  category: string;
  total: string;
  count: number;
}

interface TrendItem {
  period: string;
  income: string;
  expense: string;
}

interface RecentItem {
  id: string;
  record_type: string;
  category: string;
  amount: string;
  description: string | null;
  recorded_at: string;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.-]+/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function TrendSvg({ trends }: { trends: TrendItem[] }) {
  const width = 640;
  const height = 210;
  const padding = 28;

  const incomeValues = trends.map((item) => parseAmount(item.income));
  const expenseValues = trends.map((item) => parseAmount(item.expense));
  const allValues = [...incomeValues, ...expenseValues];
  const maxValue = Math.max(...allValues, 1);

  const getPoint = (index: number, value: number) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(trends.length - 1, 1);
    const y = height - padding - (value / maxValue) * (height - padding * 2);
    return `${x},${y}`;
  };

  const incomeLine = incomeValues.map((value, index) => getPoint(index, value)).join(" ");
  const expenseLine = expenseValues.map((value, index) => getPoint(index, value)).join(" ");

  return (
    <div className="chart-shell" role="img" aria-label="Income and expense trend lines">
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" preserveAspectRatio="none">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="axis-line" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="axis-line" />
        <polyline points={incomeLine} className="line-income" />
        <polyline points={expenseLine} className="line-expense" />
        {incomeValues.map((value, index) => {
          const [x, y] = getPoint(index, value).split(",");
          return <circle key={`income-${trends[index]?.period ?? index}`} cx={x} cy={y} r="3.5" className="dot-income" />;
        })}
        {expenseValues.map((value, index) => {
          const [x, y] = getPoint(index, value).split(",");
          return <circle key={`expense-${trends[index]?.period ?? index}`} cx={x} cy={y} r="3.5" className="dot-expense" />;
        })}
      </svg>
      <div className="chart-x-labels" aria-hidden="true">
        {trends.map((t) => (
          <span key={t.period}>{t.period}</span>
        ))}
      </div>
    </div>
  );
}

function DashboardEmptyState() {
  return (
    <section className="card reveal dashboard-empty-state" aria-labelledby="dashboard-empty-title">
      <h2 id="dashboard-empty-title">Your dashboard story starts here</h2>
      <p className="muted">
        There are no transactions yet. Seed demo data to unlock trend lines, category signals,
        and recent activity insights for your stakeholders.
      </p>
      <div className="actions">
        <code>make seed</code>
        <span className="muted">or</span>
        <code>docker compose exec backend uv run python scripts/seed_demo_data.py</code>
      </div>
    </section>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary(),
      api.getDashboardByCategory(),
      api.getDashboardTrends(),
      api.getDashboardRecent(),
    ])
      .then(([s, c, t, r]) => {
        setSummary(s);
        setCategories(c.items);
        setTrends(t.items);
        setRecent(r.items);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!summary) return <p>No data</p>;

  const income = parseAmount(summary.total_income);
  const expense = parseAmount(summary.total_expense);
  const net = parseAmount(summary.net);
  const largestCategory = categories.reduce<{ category: string; total: number }>(
    (current, item) => {
      const total = parseAmount(item.total);
      if (total > current.total) {
        return { category: item.category, total };
      }
      return current;
    },
    { category: "-", total: 0 }
  );

  const totalCategoryAmount = categories.reduce((sum, item) => sum + parseAmount(item.total), 0);
  const metricCards = [
    { label: "Income", value: formatCurrency(income), tone: "income" },
    { label: "Expenses", value: formatCurrency(expense), tone: "expense" },
    { label: "Net", value: formatCurrency(net), tone: "net" },
    { label: "Records", value: String(summary.record_count), tone: "records" },
  ];
  const hasRecords = summary.record_count > 0;

  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="muted">High-level performance and record trends.</p>
        </div>
      </div>

      <section className="card reveal" aria-labelledby="summary-title">
        <h2 id="summary-title">Summary</h2>
        <div className="grid cols-4">
          {metricCards.map((card) => (
            <article key={card.label} className={`kpi-card ${card.tone}`}>
              <div className="muted">{card.label}</div>
              <p className="metric-value">{card.value}</p>
            </article>
          ))}
        </div>
      </section>

      {!hasRecords && <DashboardEmptyState />}

      <section className="card reveal" aria-labelledby="category-title">
        <h2 id="category-title">By Category</h2>
        <div className="category-bars" aria-label="Category distribution">
          {categories.length === 0 && <p className="muted">No category totals available yet.</p>}
          {categories.map((item) => {
            const total = parseAmount(item.total);
            const widthPercent = totalCategoryAmount > 0 ? Math.max((total / totalCategoryAmount) * 100, 3) : 3;
            return (
              <div key={item.category} className="category-row">
                <div className="category-title">
                  <span>{item.category}</span>
                  <span>{item.count} records</span>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <div className="bar-fill" style={{ width: `${widthPercent}%` }} />
                </div>
                <div className="category-amount">{formatCurrency(total)}</div>
              </div>
            );
          })}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Category</th><th>Total</th><th>Count</th></tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">No category data yet.</td>
                </tr>
              ) : null}
              {categories.map((c) => (
                <tr key={c.category}>
                  <td>{c.category}</td>
                  <td>{c.total}</td>
                  <td>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card reveal" aria-labelledby="trends-title">
        <h2 id="trends-title">Trends</h2>
        {trends.length === 0 && <p className="muted">No monthly trend data yet.</p>}
        {trends.length > 1 ? (
          <>
            <TrendSvg trends={trends} />
            <div className="actions muted" style={{ marginTop: "0.5rem" }}>
              <span>Income line</span>
              <span>-</span>
              <span>Expense line</span>
            </div>
          </>
        ) : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Period</th><th>Income</th><th>Expense</th></tr>
            </thead>
            <tbody>
              {trends.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">No trend periods yet.</td>
                </tr>
              ) : null}
              {trends.map((t) => (
                <tr key={t.period}>
                  <td>{t.period}</td>
                  <td>{t.income}</td>
                  <td>{t.expense}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card reveal" aria-labelledby="recent-title">
        <h2 id="recent-title">Recent Records</h2>
        <div className="grid cols-2">
          <article className="insight-card">
            <h3>Largest Category</h3>
            <p className="metric-value">{largestCategory.category}</p>
            <p className="muted">{formatCurrency(largestCategory.total)}</p>
          </article>
          <article className="insight-card">
            <h3>Balance Health</h3>
            <p className="metric-value">{net >= 0 ? "Positive" : "Negative"}</p>
            <p className="muted">Based on current period totals</p>
          </article>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Type</th><th>Category</th><th>Amount</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">No recent records yet.</td>
                </tr>
              ) : null}
              {recent.map((r) => (
                <tr key={r.id}>
                  <td>{r.record_type}</td>
                  <td>{r.category}</td>
                  <td>{r.amount}</td>
                  <td>{new Date(r.recorded_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
