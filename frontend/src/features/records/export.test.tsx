import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("../auth/authStore", () => {
  const state = { accessToken: "test-token", role: "admin" };
  const useAuthStore = vi.fn((selector?: (s: typeof state) => unknown) =>
    selector ? selector(state) : state
  ) as unknown as ((selector?: (s: typeof state) => unknown) => unknown) & {
    getState: () => typeof state;
  };
  useAuthStore.getState = () => state;
  return { useAuthStore };
});

vi.stubGlobal("fetch", mockFetch);

describe("Records export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
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
    expect(await screen.findByRole("button", { name: "CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PDF" })).toBeInTheDocument();
  });

  it("calls PDF export endpoint and downloads a pdf file", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<RecordsPage />} />
        </Routes>
      </MemoryRouter>
    );

    const pdfButton = await screen.findByRole("button", { name: "PDF" });
    await userEvent.click(pdfButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/v1/export/pdf", {
        headers: { Authorization: "Bearer test-token" },
      });
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });
});
