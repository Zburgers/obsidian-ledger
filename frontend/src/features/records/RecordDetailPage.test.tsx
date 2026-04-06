import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordDetailPage } from "./RecordDetailPage";

const mockGetRecord = vi.fn();
const mockDeleteRecord = vi.fn();

vi.mock("../../lib/api", () => ({
  api: {
    getRecord: (id: string) => mockGetRecord(id),
    deleteRecord: (id: string) => mockDeleteRecord(id),
  },
}));

vi.mock("../auth/authStore", () => {
  const state = { role: "admin" };
  const useAuthStore = vi.fn((selector?: (s: typeof state) => unknown) =>
    selector ? selector(state) : state
  ) as unknown as ((selector?: (s: typeof state) => unknown) => unknown) & {
    getState: () => typeof state;
  };
  useAuthStore.getState = () => state;
  return { useAuthStore };
});

describe("RecordDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
    mockGetRecord.mockResolvedValue({
      id: "r1",
      user_id: "u1",
      record_type: "expense",
      category: "Food",
      amount: "12.50",
      description: "Lunch",
      recorded_at: "2026-04-01T10:00:00Z",
    });
    mockDeleteRecord.mockResolvedValue(undefined);
  });

  it("shows delete action for admin and deletes record", async () => {
    const onBack = vi.fn();
    render(<RecordDetailPage recordId="r1" onBack={onBack} />);

    const deleteButton = await screen.findByRole("button", { name: "Delete" });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteRecord).toHaveBeenCalledWith("r1");
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("does not show delete action for non-admin users", async () => {
    const auth = await import("../auth/authStore");
    const state = { role: "viewer" };
    const useAuthStore = auth.useAuthStore as unknown as {
      mockImplementation: (fn: (selector?: (s: typeof state) => unknown) => unknown) => void;
      getState: () => typeof state;
    };
    useAuthStore.mockImplementation((selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state
    );

    render(<RecordDetailPage recordId="r1" onBack={vi.fn()} />);

    await screen.findByText("Record Detail");
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
