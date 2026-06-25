import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const results = [];
const strict = process.env.ADMIN_READINESS_STRICT === "true";

function add(name, status, details = "") {
  results.push({ name, status, details });
}

function hasEnv(name) {
  return Boolean(process.env[name]?.trim());
}

function checkFile(path, pattern) {
  const full = resolve(root, path);
  if (!existsSync(full)) {
    add(`file:${path}`, "fail", "arquivo ausente");
    return "";
  }
  const content = readFileSync(full, "utf8");
  if (pattern && !pattern.test(content)) add(`file:${path}`, "fail", `não contém ${pattern}`);
  else add(`file:${path}`, "pass");
  return content;
}

async function smoke(path, expected = 200) {
  const base = process.env.ADMIN_STAGING_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    add(`http:${path}`, strict ? "fail" : "skip", "ADMIN_STAGING_BASE_URL ausente");
    return;
  }
  try {
    const response = await fetch(`${base}${path}`, { redirect: "manual" });
    const ok = Array.isArray(expected) ? expected.includes(response.status) : response.status === expected;
    add(`http:${path}`, ok ? "pass" : "fail", `status=${response.status}`);
  } catch (error) {
    add(`http:${path}`, "fail", error instanceof Error ? error.message : "erro HTTP");
  }
}

function checkEnv(name, required = true) {
  const present = hasEnv(name);
  add(`env:${name}`, present ? "pass" : required ? "fail" : "warn", present ? "configured" : "missing");
}

checkFile("prisma/schema.prisma", /ArchiveRestoreJob/);
checkFile("prisma/migrations/20260624110000_admin_wave5_archive_restore/migration.sql", /ArchiveRestoreJob/);
checkFile("prisma/migrations/20260624120000_admin_wave6_export_restore_hardening/migration.sql", /ExportJob_storageProvider_storageKey_idx/);
checkFile("lib/archive-storage.ts", /class S3ArchiveStorage/);
checkFile("lib/admin-archive-restore.ts", /processArchiveRestoreJob/);
checkFile("app/admin/archive/page.tsx", /Restore controlado/);
checkFile("ADMIN_PRODUCTION_READINESS.md", /Archive Restore/);
checkFile("ADMIN_RELEASE_REVIEW.md", /Revisão Controlada/);

for (const env of ["DATABASE_URL", "DIRECT_URL", "AUTH_SECRET", "AUTH_URL"]) checkEnv(env);
for (const env of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]) checkEnv(env, strict);

const storageProvider = process.env.ARCHIVE_STORAGE_PROVIDER?.trim();
if (storageProvider === "s3") {
  for (const env of ["ARCHIVE_S3_ENDPOINT", "ARCHIVE_S3_BUCKET", "ARCHIVE_S3_ACCESS_KEY_ID", "ARCHIVE_S3_SECRET_ACCESS_KEY"]) checkEnv(env);
  checkEnv("ARCHIVE_S3_REGION", false);
  checkEnv("ARCHIVE_S3_PREFIX", false);
} else if (process.env.NODE_ENV === "production") {
  add("archive:provider", "fail", "produção exige ARCHIVE_STORAGE_PROVIDER=s3");
} else if (strict) {
  add("archive:provider", "fail", "staging readiness estrito exige ARCHIVE_STORAGE_PROVIDER=s3");
} else {
  add("archive:provider", "warn", "fallback local permitido apenas em desenvolvimento/teste");
}

if (hasEnv("ADMIN_EXPORT_ALLOW_INLINE_FALLBACK") && process.env.NODE_ENV === "production") {
  add("export:inline_fallback", "fail", "ADMIN_EXPORT_ALLOW_INLINE_FALLBACK não pode estar ativo em produção");
} else if (hasEnv("ADMIN_EXPORT_ALLOW_INLINE_FALLBACK")) {
  add("export:inline_fallback", "warn", "fallback inline permitido apenas para compatibilidade local/dev");
} else {
  add("export:inline_fallback", "pass", "disabled");
}

await smoke("/", [200, 307, 308]);
await smoke("/login", [200, 307, 308]);
await smoke("/admin", [302, 303, 307, 308]);
await smoke("/api/health", [200, 503]);

const failed = results.filter((item) => item.status === "fail");
const warned = results.filter((item) => item.status === "warn");

console.log(JSON.stringify({
  ok: failed.length === 0,
  summary: {
    pass: results.filter((item) => item.status === "pass").length,
    warn: warned.length,
    fail: failed.length,
    skip: results.filter((item) => item.status === "skip").length
  },
  results
}, null, 2));

process.exit(failed.length > 0 ? 1 : 0);
