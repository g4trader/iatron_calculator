import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseSkin, skinFromPrisma, skinToPrisma } from "../lib/skin";

const schemaSource = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migrationSource = readFileSync(new URL("../prisma/migrations/20260708180000_skin_preferences/migration.sql", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const profileRouteSource = readFileSync(new URL("../app/api/profile/route.ts", import.meta.url), "utf8");
const systemPageSource = readFileSync(new URL("../app/admin/system/page.tsx", import.meta.url), "utf8");
const systemActionsSource = readFileSync(new URL("../app/admin/system/actions.ts", import.meta.url), "utf8");

describe("skin preferences", () => {
  it("normalizes supported skins", () => {
    assert.equal(parseSkin("dark"), "dark");
    assert.equal(parseSkin("light"), "light");
    assert.equal(parseSkin("unknown"), null);
    assert.equal(skinToPrisma("dark"), "DARK");
    assert.equal(skinToPrisma("light"), "LIGHT");
    assert.equal(skinFromPrisma("DARK"), "dark");
    assert.equal(skinFromPrisma("LIGHT"), "light");
  });

  it("persists user and global skin in Prisma", () => {
    assert.match(schemaSource, /enum SkinPreference/);
    assert.match(schemaSource, /skinPreference\s+SkinPreference\?/);
    assert.match(schemaSource, /model AppSetting/);
    assert.match(migrationSource, /default_skin/);
  });

  it("applies skin server-side to avoid first paint mismatch", () => {
    assert.match(layoutSource, /getServerSkin/);
    assert.match(layoutSource, /data-skin=\{skin\}/);
  });

  it("allows user and admin updates with audit for global default", () => {
    assert.match(profileRouteSource, /skinPreference/);
    assert.match(profileRouteSource, /SKIN_COOKIE/);
    assert.match(systemPageSource, /Skin padrão do SaaS/);
    assert.match(systemActionsSource, /admin\.system\.default_skin_updated/);
    assert.match(systemActionsSource, /recordAdminAuditEvent/);
  });
});
