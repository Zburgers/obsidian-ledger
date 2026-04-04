import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RecordsPage } from "./RecordsPage";

const mockListRecords = vi.fn();

vi.mock("../auth/authStore", () => ({
  useAuthStore: {
    getState: () => ({ accessToken: "test-token" }),
  },
}));

vi.mock("../../lib/api", () => ({
  setTokenGetter: vi.fn(),
  api: {
    listRecords: (q?: string) => mockListRecords(q),
    createRecord: vi.fn(),
    updateRecord: vi.fn(),
    getRecord: vi.fn(),
    deleteRecord: vi.fn(),
  },
}));

describe("Records page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListRecords.mockResolvedValue({
      items: [
        { id: "1", user_id: "u1", record_type: "expense", category: "Food", amount: "25.50", description: "Lunch", recorded_at: "2025-01-01T12:00:00Z", is_deleted: false },
        { id: "2", user_id: "u1", record_type: "income", category: "Salary", amount: "5000", description: null, recorded_at: "2025-01-02T09:00:00Z", is_deleted: false },
      ],
      total: 2,
      page: 1,
      page_size: 20,
    });
  });

  it("renders records list", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<RecordsPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    mockListRecords.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<RecordsPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Loading records...")).toBeInTheDocument();
  });

  it("passes filter params to API", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<RecordsPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText("Food")).toBeInTheDocument();
    expect(mockListRecords).toHaveBeenCalledWith("page=1&page_size=20");
  });
});
