import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";

const mockGetSummary = vi.fn();
const mockGetByCategory = vi.fn();
const mockGetTrends = vi.fn();
const mockGetRecent = vi.fn();

vi.mock("../../lib/api", () => ({
  setTokenGetter: vi.fn(),
  api: {
    getDashboardSummary: () => mockGetSummary(),
    getDashboardByCategory: () => mockGetByCategory(),
    getDashboardTrends: () => mockGetTrends(),
    getDashboardRecent: () => mockGetRecent(),
  },
}));

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSummary.mockResolvedValue({ total_income: "5000", total_expense: "200", net: "4800", record_count: 3 });
    mockGetByCategory.mockResolvedValue({ items: [{ category: "Food", total: "150", count: 2 }] });
    mockGetTrends.mockResolvedValue({ items: [{ period: "2025-01", income: "5000", expense: "200" }] });
    mockGetRecent.mockResolvedValue({ items: [{ id: "1", record_type: "expense", category: "Food", amount: "25", description: null, recorded_at: "2025-01-01T12:00:00Z" }] });
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
    expect(screen.getByText("Recent Records")).toBeInTheDocument();
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
});
