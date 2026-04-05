import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../auth/authStore";

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

interface ComparisonData {
  period_a: string;
  period_b: string;
  totals_a: { income: string; expense: string; net: string };
  totals_b: { income: string; expense: string; net: string };
  income_delta: string;
  expense_delta: string;
  net_delta: string;
}

function getComparisonPeriods(): { periodA: string; periodB: string } {
  const now = new Date();
  const periodBDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodADate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const formatPeriod = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };
  return { periodA: formatPeriod(periodADate), periodB: formatPeriod(periodBDate) };
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

function formatCompactCurrency(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) {
    return `${value >= 0 ? "" : "-"}$${(absValue / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${value >= 0 ? "" : "-"}$${(absValue / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

/* ─────────────────────────────────────────────────────────────
   Delta Indicator - Shows +/- change with arrow
───────────────────────────────────────────────────────────── */
function DeltaIndicator({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  const arrow = isPositive ? "↑" : "↓";
  const tone = label.toLowerCase().includes("expense") 
    ? (isPositive ? "negative" : "positive")  // For expenses, up is bad
    : (isPositive ? "positive" : "negative"); // For income/net, up is good
  
  return (
    <span className={`delta-indicator delta-${tone}`}>
      <span className="delta-arrow">{arrow}</span>
      <span className="delta-value">{formatCompactCurrency(Math.abs(value))}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Smooth Bezier Trend Chart with Gradient Fill
───────────────────────────────────────────────────────────── */
function TrendChart({ trends }: { trends: TrendItem[] }) {
  const width = 700;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const incomeValues = trends.map((item) => parseAmount(item.income));
  const expenseValues = trends.map((item) => parseAmount(item.expense));
  const allValues = [...incomeValues, ...expenseValues];
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;

  const getX = (index: number) => paddingX + (index / Math.max(trends.length - 1, 1)) * chartWidth;
  const getY = (value: number) => paddingY + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Create smooth bezier curve path
  const createSmoothPath = (values: number[]): string => {
    if (values.length < 2) return "";
    
    const points = values.map((v, i) => ({ x: getX(i), y: getY(v) }));
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    return path;
  };

  // Create gradient fill path (closes path to bottom)
  const createGradientPath = (values: number[]): string => {
    if (values.length < 2) return "";
    const linePath = createSmoothPath(values);
    const lastX = getX(values.length - 1);
    const firstX = getX(0);
    const bottomY = height - paddingY;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const incomePath = createSmoothPath(incomeValues);
  const expensePath = createSmoothPath(expenseValues);
  const incomeGradientPath = createGradientPath(incomeValues);
  const expenseGradientPath = createGradientPath(expenseValues);

  return (
    <div className="chart-shell" role="img" aria-label="Income and expense trend chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-positive)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-positive)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-negative)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-negative)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={paddingX}
            y1={paddingY + chartHeight * ratio}
            x2={width - paddingX}
            y2={paddingY + chartHeight * ratio}
            className="axis-line"
            strokeDasharray="4,4"
            opacity="0.3"
          />
        ))}
        
        {/* X axis */}
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} className="axis-line" />
        
        {/* Gradient fills (behind lines) */}
        <path d={incomeGradientPath} fill="url(#incomeGradient)" />
        <path d={expenseGradientPath} fill="url(#expenseGradient)" />
        
        {/* Smooth bezier curves */}
        <path d={incomePath} className="line-income" />
        <path d={expensePath} className="line-expense" />
        
        {/* Data points */}
        {incomeValues.map((value, index) => (
          <circle
            key={`income-${trends[index]?.period ?? index}`}
            cx={getX(index)}
            cy={getY(value)}
            r="4"
            className="dot-income"
          />
        ))}
        {expenseValues.map((value, index) => (
          <circle
            key={`expense-${trends[index]?.period ?? index}`}
            cx={getX(index)}
            cy={getY(value)}
            r="4"
            className="dot-expense"
          />
        ))}
      </svg>
      
      <div className="chart-x-labels" aria-hidden="true">
        {trends.map((t) => (
          <span key={t.period}>{t.period}</span>
        ))}
      </div>
      
      <div className="chart-legend">
        <div className="chart-legend-item">
          <span className="chart-legend-dot income" />
          <span>Income</span>
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-dot expense" />
          <span>Expense</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Category Donut Chart
───────────────────────────────────────────────────────────── */
function CategoryDonut({ categories }: { categories: CategoryItem[] }) {
  const total = categories.reduce((sum, item) => sum + parseAmount(item.total), 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  // Color palette for categories
  const colors = [
    "var(--color-primary)",
    "var(--color-positive)",
    "var(--color-warning)",
    "var(--color-negative)",
    "#8B5CF6", // Purple
  ];
  
  let accumulatedOffset = 0;
  const segments = categories.slice(0, 5).map((item, index) => {
    const value = parseAmount(item.total);
    const percentage = total > 0 ? value / total : 0;
    const dashArray = percentage * circumference;
    const dashOffset = -accumulatedOffset;
    accumulatedOffset += dashArray;
    
    return {
      ...item,
      color: colors[index % colors.length],
      dashArray,
      dashOffset,
      percentage,
    };
  });

  return (
    <div className="donut-chart-container">
      <svg className="donut-svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} className="donut-track" />
        {segments.map((segment, index) => (
          <circle
            key={segment.category}
            cx="60"
            cy="60"
            r={radius}
            className="donut-segment"
            stroke={segment.color}
            strokeDasharray={`${segment.dashArray} ${circumference - segment.dashArray}`}
            strokeDashoffset={segment.dashOffset}
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </svg>
      <div className="donut-legend">
        {segments.map((segment) => (
          <div key={segment.category} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: segment.color }} />
            <span>{segment.category}</span>
            <span className="muted" style={{ marginLeft: "auto" }}>
              {(segment.percentage * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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
   Empty State
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   Main Dashboard Page
───────────────────────────────────────────────────────────── */
export function DashboardPage() {
  const role = useAuthStore((s) => s.role);
  const canViewInsights = role === "analyst" || role === "admin";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseRequests = [api.getDashboardSummary(), api.getDashboardRecent()] as const;

    Promise.all(baseRequests)
      .then(async ([s, r]) => {
        setSummary(s);
        setRecent(r.items);

        if (!canViewInsights) {
          setCategories([]);
          setTrends([]);
          setComparison(null);
          return;
        }

        const { periodA, periodB } = getComparisonPeriods();
        const [c, t, cmp] = await Promise.all([
          api.getDashboardByCategory(),
          api.getDashboardTrends(),
          api.getDashboardComparison(periodA, periodB),
        ]);
        setCategories(c.items);
        setTrends(t.items);
        setComparison(cmp);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [canViewInsights]);

  if (loading) return <p className="muted">Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!summary) return <p className="muted">No data available</p>;

  const income = parseAmount(summary.total_income);
  const expense = parseAmount(summary.total_expense);
  const net = parseAmount(summary.net);
  const hasRecords = summary.record_count > 0;

  const totalCategoryAmount = categories.reduce((sum, item) => sum + parseAmount(item.total), 0);

  return (
    <div className="dashboard-grid">
      {/* ─── Monthly Comparison Row (Top) ─── */}
      {canViewInsights && comparison && (
        <section className="comparison-row reveal" aria-labelledby="comparison-title">
          <h2 id="comparison-title" className="sr-only">Monthly Comparison</h2>
          <div className="grid cols-3">
            <article className="kpi-card income">
              <div className="kpi-header">
                <span className="kpi-label">Income</span>
                <DeltaIndicator value={parseAmount(comparison.income_delta)} label="income" />
              </div>
              <p className="metric-value">{formatCurrency(parseAmount(comparison.totals_b.income))}</p>
              <p className="kpi-subtext muted">vs {comparison.period_a}</p>
            </article>
            
            <article className="kpi-card expense">
              <div className="kpi-header">
                <span className="kpi-label">Expenses</span>
                <DeltaIndicator value={parseAmount(comparison.expense_delta)} label="expense" />
              </div>
              <p className="metric-value">{formatCurrency(parseAmount(comparison.totals_b.expense))}</p>
              <p className="kpi-subtext muted">vs {comparison.period_a}</p>
            </article>
            
            <article className="kpi-card net">
              <div className="kpi-header">
                <span className="kpi-label">Net</span>
                <DeltaIndicator value={parseAmount(comparison.net_delta)} label="net" />
              </div>
              <p className="metric-value">{formatCurrency(parseAmount(comparison.totals_b.net))}</p>
              <p className="kpi-subtext muted">vs {comparison.period_a}</p>
            </article>
          </div>
        </section>
      )}

      {/* ─── Fallback Summary Row (when no comparison) ─── */}
      {(!canViewInsights || !comparison) && (
        <section className="card reveal" aria-labelledby="summary-title">
          <h2 id="summary-title">Summary</h2>
          <div className="grid cols-4">
            <article className="kpi-card income">
              <span className="kpi-label">Income</span>
              <p className="metric-value">{formatCurrency(income)}</p>
            </article>
            <article className="kpi-card expense">
              <span className="kpi-label">Expenses</span>
              <p className="metric-value">{formatCurrency(expense)}</p>
            </article>
            <article className="kpi-card net">
              <span className="kpi-label">Net</span>
              <p className="metric-value">{formatCurrency(net)}</p>
            </article>
            <article className="kpi-card records">
              <span className="kpi-label">Records</span>
              <p className="metric-value">{summary.record_count}</p>
            </article>
          </div>
        </section>
      )}

      {!hasRecords && <DashboardEmptyState />}

      {/* ─── Trend Chart (Middle) ─── */}
      {canViewInsights && trends.length > 1 && (
        <section className="card reveal" aria-labelledby="trends-title">
          <h2 id="trends-title">Cash Flow Trends</h2>
          <TrendChart trends={trends} />
        </section>
      )}

      {/* ─── Bottom Row: Categories + Recent ─── */}
      <div className="dashboard-bottom-row">
        {/* Categories */}
        {canViewInsights && categories.length > 0 && (
          <section className="card reveal" aria-labelledby="category-title">
            <h2 id="category-title">Top Categories</h2>
            <CategoryDonut categories={categories} />
            <div className="category-bars">
              {categories.slice(0, 5).map((item) => {
                const total = parseAmount(item.total);
                const widthPercent = totalCategoryAmount > 0 ? Math.max((total / totalCategoryAmount) * 100, 3) : 3;
                return (
                  <div key={item.category} className="category-row">
                    <div className="category-title">
                      <span>{item.category}</span>
                      <span className="category-amount">{formatCurrency(total)}</span>
                    </div>
                    <div className="bar-track" aria-hidden="true">
                      <div className="bar-fill" style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Records */}
        <section className="card reveal" aria-labelledby="recent-title">
          <h2 id="recent-title">Recent Activity</h2>
          {recent.length === 0 ? (
            <p className="muted">No recent transactions</p>
          ) : (
            <div className="recent-list">
              {recent.slice(0, 6).map((r) => (
                <div key={r.id} className="recent-item">
                  <TransactionArrow type={r.record_type} />
                  <div className="recent-details">
                    <span className="recent-category">{r.category}</span>
                    <span className="recent-date muted">
                      {new Date(r.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <span className={`recent-amount ${r.record_type.toLowerCase()}`}>
                    {r.record_type.toLowerCase() === "income" ? "+" : "-"}{r.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── Insight Cards ─── */}
      <section className="insight-row reveal">
        <article className="insight-card">
          <h3>Balance Status</h3>
          <p className={`metric-value ${net >= 0 ? "positive" : "negative"}`}>
            {net >= 0 ? "Healthy" : "Deficit"}
          </p>
          <p className="muted">Net: {formatCurrency(net)}</p>
        </article>
        <article className="insight-card">
          <h3>Total Records</h3>
          <p className="metric-value">{summary.record_count}</p>
          <p className="muted">All-time transactions</p>
        </article>
        {canViewInsights && categories.length > 0 && (
          <article className="insight-card">
            <h3>Top Spend</h3>
            <p className="metric-value">{categories[0]?.category ?? "-"}</p>
            <p className="muted">{formatCurrency(parseAmount(categories[0]?.total ?? "0"))}</p>
          </article>
        )}
      </section>
    </div>
  );
}
