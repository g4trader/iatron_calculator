import { execFileSync } from "node:child_process";
import { loadOperationalEnv } from "./load-env.mjs";

loadOperationalEnv();

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  throw new Error("DATABASE_URL e DIRECT_URL são obrigatórios para prisma:deploy. Configure .env.e2e.local, .env.local ou exporte as envs.");
}

if (process.env.IATRON_ENV === "production" && process.env.ALLOW_PRODUCTION_MIGRATIONS !== "true") {
  throw new Error("Migrations em produção exigem ALLOW_PRODUCTION_MIGRATIONS=true.");
}

execFileSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env
});

execFileSync("npx", ["prisma", "generate"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env
});
