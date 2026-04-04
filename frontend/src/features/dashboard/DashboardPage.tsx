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
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!summary) return <p>No data</p>;

  return (
    <div>
      <h1>Dashboard</h1>

      <section>
        <h2>Summary</h2>
        <div>
          <div><strong>Income:</strong> {summary.total_income}</div>
          <div><strong>Expenses:</strong> {summary.total_expense}</div>
          <div><strong>Net:</strong> {summary.net}</div>
          <div><strong>Records:</strong> {summary.record_count}</div>
        </div>
      </section>

      <section>
        <h2>By Category</h2>
        <table>
          <thead>
            <tr><th>Category</th><th>Total</th><th>Count</th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.category}>
                <td>{c.category}</td>
                <td>{c.total}</td>
                <td>{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Trends</h2>
        <table>
          <thead>
            <tr><th>Period</th><th>Income</th><th>Expense</th></tr>
          </thead>
          <tbody>
            {trends.map((t) => (
              <tr key={t.period}>
                <td>{t.period}</td>
                <td>{t.income}</td>
                <td>{t.expense}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Recent Records</h2>
        <table>
          <thead>
            <tr><th>Type</th><th>Category</th><th>Amount</th><th>Date</th></tr>
          </thead>
          <tbody>
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
      </section>
    </div>
  );
}
