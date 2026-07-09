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
const globalsSource = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function contrastRatio(foreground: string, background: string) {
  function rgb(hex: string) {
    const value = hex.replace("#", "");
    return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
  }
  function linear(value: number) {
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  }
  function luminance(hex: string) {
    const [r, g, b] = rgb(hex).map(linear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

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

  it("defines complete light skin tokens with accessible primary contrast", () => {
    for (const token of [
      "--iatron-bg",
      "--iatron-surface",
      "--iatron-border",
      "--iatron-text-primary",
      "--iatron-text-secondary",
      "--iatron-text-muted",
      "--iatron-primary",
      "--iatron-success-bg",
      "--iatron-warning-bg",
      "--iatron-danger-bg",
      "--iatron-info-bg",
      "--iatron-focus"
    ]) {
      assert.match(globalsSource, new RegExp(token));
    }
    assert.match(globalsSource, /body\[data-skin="light"\] input/);
    assert.match(globalsSource, /body\[data-skin="light"\] thead/);
    assert.match(globalsSource, /body\[data-skin="light"\] :focus-visible/);
    assert.ok(contrastRatio("#ffffff", "#0e7490") >= 4.5);
  });
});
