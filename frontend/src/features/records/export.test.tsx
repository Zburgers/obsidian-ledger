import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RecordsPage } from "./RecordsPage";

const mockListRecords = vi.fn();
const mockFetch = vi.fn();

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

vi.mock("../auth/authStore", () => ({
  useAuthStore: vi.fn(() => ({ accessToken: "test-token" })),
}));

vi.stubGlobal("fetch", mockFetch);

describe("Records export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListRecords.mockResolvedValue({
      items: [
        { id: "1", user_id: "u1", record_type: "expense", category: "Food", amount: "25.50", description: "Lunch", recorded_at: "2025-01-01T12:00:00Z", is_deleted: false },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["test"]),
    });
  });

  it("shows export buttons", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<RecordsPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText("Export CSV")).toBeInTheDocument();
    expect(screen.getByText("Export PDF")).toBeInTheDocument();
  });
});
