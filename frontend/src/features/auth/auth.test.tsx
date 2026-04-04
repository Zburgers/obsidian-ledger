import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "../../App";
import { useAuthStore } from "./authStore";

describe("Protected routing", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("redirects unauthenticated user from /dashboard to /login", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Login");
  });

  it("redirects unauthenticated user from /users to /login", () => {
    render(
      <MemoryRouter initialEntries={["/users"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Login");
  });

  it("redirects non-admin authenticated user from /users to /dashboard", () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: "test-token",
      email: "user@test.com",
      role: "viewer",
    });

    render(
      <MemoryRouter initialEntries={["/users"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard");
  });

  it("shows login form with email and password fields", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("shows register form with email, password and name fields", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });
});
