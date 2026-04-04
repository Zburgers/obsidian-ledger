import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const typesFile = join(__dirname, "..", "types", "api.ts");

describe("API contract", () => {
  it("generated types file exists", () => {
    expect(existsSync(typesFile)).toBe(true);
  });

  it("types file contains expected endpoint paths", () => {
    const content = readFileSync(typesFile, "utf-8");
    expect(content).toContain("/auth/login");
    expect(content).toContain("/auth/register");
    expect(content).toContain("/auth/refresh");
    expect(content).toContain("/auth/me");
    expect(content).toContain("/users");
    expect(content).toContain("/records");
    expect(content).toContain("/dashboard/summary");
    expect(content).toContain("/dashboard/by-category");
    expect(content).toContain("/dashboard/trends");
    expect(content).toContain("/dashboard/recent");
    expect(content).toContain("/export/csv");
    expect(content).toContain("/export/txt");
  });

  it("types file contains expected schema types", () => {
    const content = readFileSync(typesFile, "utf-8");
    expect(content).toContain("TokenResponse");
    expect(content).toContain("UserResponse");
    expect(content).toContain("RecordResponse");
    expect(content).toContain("RecordListResponse");
    expect(content).toContain("SummaryResponse");
  });
});
