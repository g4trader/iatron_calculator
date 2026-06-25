import { execFileSync } from "node:child_process";
import path from "node:path";
import { loadE2EEnv } from "./load-env";

export default async function globalSetup() {
  loadE2EEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL é obrigatório para rodar os testes E2E. Configure .env.e2e.local ou exporte DATABASE_URL no shell.");
  }

  execFileSync("node", [path.join(process.cwd(), "scripts/e2e-seed.mjs")], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env
  });
}
