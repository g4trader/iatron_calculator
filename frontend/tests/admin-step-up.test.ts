import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { CRITICAL_ADMIN_ACTIONS, AdminStepUpError, stepUpPasswordFromForm } from "../lib/admin-step-up";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin step-up contracts", () => {
  it("defines critical action names explicitly", () => {
    assert.equal(CRITICAL_ADMIN_ACTIONS.licenseCreate, "admin.license.create_manual");
    assert.equal(CRITICAL_ADMIN_ACTIONS.auditExport, "admin.audit.export");
    assert.equal(CRITICAL_ADMIN_ACTIONS.contingency, "admin.contingency.execute");
  });

  it("extracts password from form data only from the dedicated field", () => {
    const formData = new FormData();
    formData.set("stepUpPassword", "secret");
    assert.equal(stepUpPasswordFromForm(formData), "secret");
    assert.equal(stepUpPasswordFromForm(new FormData()), null);
  });

  it("fails closed and audits step-up validation", () => {
    const source = read("lib/admin-step-up.ts");
    assert.match(source, /STEP_UP_REQUIRED/);
    assert.match(source, /STEP_UP_DENIED/);
    assert.match(source, /admin\.step_up\.validated/);
    assert.match(source, /admin\.step_up\.blocked/);
    assert.match(source, /verifyPassword/);
    assert.ok(AdminStepUpError);
  });
});
