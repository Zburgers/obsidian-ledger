import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { useAuthStore } from "../auth/authStore";

const mockGetSummary = vi.fn();
const mockGetByCategory = vi.fn();
const mockGetTrends = vi.fn();
const mockGetRecent = vi.fn();
const mockGetComparison = vi.fn();

vi.mock("../auth/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  setTokenGetter: vi.fn(),
  api: {
    getDashboardSummary: () => mockGetSummary(),
    getDashboardByCategory: () => mockGetByCategory(),
    getDashboardTrends: () => mockGetTrends(),
    getDashboardRecent: () => mockGetRecent(),
    getDashboardComparison: (...args: [string, string]) => mockGetComparison(...args),
  },
}));

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: unknown) => unknown) =>
      selector({ role: "analyst" })) as typeof useAuthStore);
    mockGetSummary.mockResolvedValue({ total_income: "5000", total_expense: "200", net: "4800", record_count: 3 });
    mockGetByCategory.mockResolvedValue({ items: [{ category: "Food", total: "150", count: 2 }] });
    mockGetTrends.mockResolvedValue({ items: [{ period: "2025-01", income: "5000", expense: "200" }] });
    mockGetRecent.mockResolvedValue({ items: [{ id: "1", record_type: "expense", category: "Food", amount: "25", description: null, recorded_at: "2025-01-01T12:00:00Z" }] });
    mockGetComparison.mockResolvedValue({
      period_a: "2026-01",
      period_b: "2026-02",
      totals_a: { income: "1000", expense: "400", net: "600" },
      totals_b: { income: "1300", expense: "450", net: "850" },
      income_delta: "300",
      expense_delta: "50",
      net_delta: "250",
    });
  });

  it("renders all dashboard sections", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("By Category")).toBeInTheDocument();
    expect(screen.getByText("Trends")).toBeInTheDocument();
    expect(screen.getByText("Monthly Comparison")).toBeInTheDocument();
    expect(screen.getByText("Recent Records")).toBeInTheDocument();
  });

  it("hides analyst insights for viewer role", async () => {
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: unknown) => unknown) =>
      selector({ role: "viewer" })) as typeof useAuthStore);

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Recent Records")).toBeInTheDocument();
    expect(screen.queryByText("By Category")).not.toBeInTheDocument();
    expect(screen.queryByText("Trends")).not.toBeInTheDocument();
    expect(screen.queryByText("Monthly Comparison")).not.toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    mockGetSummary.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
  });

  it("shows an empty-state story when there are no records", async () => {
    mockGetSummary.mockResolvedValue({ total_income: "0", total_expense: "0", net: "0", record_count: 0 });
    mockGetByCategory.mockResolvedValue({ items: [] });
    mockGetTrends.mockResolvedValue({ items: [] });
    mockGetRecent.mockResolvedValue({ items: [] });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Your dashboard story starts here")).toBeInTheDocument();
    expect(screen.getByText("No category totals available yet.")).toBeInTheDocument();
    expect(screen.getByText("No recent records yet.")).toBeInTheDocument();
  });
});
