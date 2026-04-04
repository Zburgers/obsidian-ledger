import { execSync } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = process.env.API_URL || "http://localhost:8000/openapi.json";
const LOCAL_SPEC = join(__dirname, "..", "openapi.json");
const OUTPUT = join(__dirname, "..", "src", "types", "api.ts");

const specSource = existsSync(LOCAL_SPEC) ? LOCAL_SPEC : API_URL;
console.log(`Generating types from ${specSource}...`);

try {
  execSync(
    `npx openapi-typescript "${specSource}" -o "${OUTPUT}"`,
    { stdio: "inherit" }
  );
  console.log(`Generated ${OUTPUT}`);
} catch (err) {
  console.error("Failed to generate API types.");
  process.exit(1);
}
