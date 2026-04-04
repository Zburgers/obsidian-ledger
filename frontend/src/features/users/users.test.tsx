import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { UsersPage } from "./UsersPage";

const mockListUsers = vi.fn();

vi.mock("../../lib/api", () => ({
  setTokenGetter: vi.fn(),
  api: {
    listUsers: () => mockListUsers(),
    updateUser: vi.fn(),
  },
}));

describe("Users page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListUsers.mockResolvedValue({
      items: [
        { id: "1", email: "a@test.com", name: "A", role: "admin", is_active: true, is_deleted: false },
        { id: "2", email: "b@test.com", name: null, role: "viewer", is_active: false, is_deleted: false },
      ],
      total: 2,
      page: 1,
      page_size: 20,
    });
  });

  it("renders users list", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<UsersPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText("a@test.com")).toBeInTheDocument();
    expect(screen.getByText("b@test.com")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    mockListUsers.mockImplementation(
      () => new Promise(() => {})
    );
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<UsersPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });
});
