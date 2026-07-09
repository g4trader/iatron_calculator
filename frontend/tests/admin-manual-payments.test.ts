import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseAmountToCents } from "../lib/admin-manual-payments";

const actionsSource = readFileSync(new URL("../app/admin/payments-manual/actions.ts", import.meta.url), "utf8");
const serviceSource = readFileSync(new URL("../lib/admin-manual-payments.ts", import.meta.url), "utf8");
const attachmentSource = readFileSync(new URL("../lib/manual-payment-attachments.ts", import.meta.url), "utf8");
const navigationSource = readFileSync(new URL("../components/admin/adminNavigation.ts", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const uploadRouteSource = readFileSync(new URL("../app/api/admin/payments-manual/[id]/attachments/upload-url/route.ts", import.meta.url), "utf8");

describe("admin manual payments", () => {
  it("parses BRL amounts safely", () => {
    assert.equal(parseAmountToCents("249,00"), 24900);
    assert.equal(parseAmountToCents("1.249,90"), 124990);
    assert.equal(parseAmountToCents("0"), 0);
    assert.throws(() => parseAmountToCents("-1"), /Valor recebido inválido/);
    assert.throws(() => parseAmountToCents("abc"), /Valor recebido inválido/);
  });

  it("requires billing permission and step-up for critical actions", () => {
    assert.match(actionsSource, /requireAdminPermission\("admin\.billing\.manage"\)/);
    assert.match(actionsSource, /validateAdminStepUp/);
    assert.match(actionsSource, /manualPaymentConfirm/);
    assert.match(actionsSource, /manualPaymentReleaseLicense/);
  });

  it("records audit events and creates license only after confirmed payment", () => {
    assert.match(serviceSource, /admin\.manual_payment\.created/);
    assert.match(serviceSource, /admin\.manual_payment\.license_released/);
    assert.match(serviceSource, /PAYMENT_NOT_CONFIRMED/);
    assert.match(serviceSource, /createManualLicense/);
    assert.match(serviceSource, /LicenseOrigin\.MANUAL_SUPPORT/);
  });

  it("adds a persisted manual payment domain model", () => {
    assert.match(schemaSource, /enum ManualPaymentMethod/);
    assert.match(schemaSource, /enum ManualPaymentStatus/);
    assert.match(schemaSource, /enum ManualPaymentAttachmentStatus/);
    assert.match(schemaSource, /model ManualPayment/);
    assert.match(schemaSource, /model ManualPaymentAttachment/);
    assert.match(schemaSource, /licenseId\s+String\?/);
    assert.match(schemaSource, /createdByUserId\s+String/);
    assert.match(schemaSource, /reconciliationReference\s+String\?/);
    assert.match(schemaSource, /attachments\s+ManualPaymentAttachment\[\]/);
  });

  it("exposes manual payments in admin navigation under billing governance", () => {
    assert.match(navigationSource, /\/admin\/payments-manual/);
    assert.match(navigationSource, /admin\.billing\.manage/);
    assert.match(navigationSource, /Pagamentos manuais/);
  });

  it("supports private receipt uploads with signed storage URLs and audit", () => {
    assert.match(attachmentSource, /createManualPaymentAttachmentUpload/);
    assert.match(attachmentSource, /completeManualPaymentAttachmentUpload/);
    assert.match(attachmentSource, /getManualPaymentAttachmentDownloadUrl/);
    assert.match(attachmentSource, /ARCHIVE_STORAGE_PROVIDER=gcs ou s3|ARCHIVE_STORAGE_PROVIDER=gcs|ARCHIVE_STORAGE_PROVIDER=s3/);
    assert.match(attachmentSource, /admin\.manual_payment\.attachment_upload_requested/);
    assert.match(attachmentSource, /admin\.manual_payment\.attachment_uploaded/);
    assert.match(attachmentSource, /admin\.manual_payment\.attachment_download_requested/);
    assert.match(uploadRouteSource, /requireAdminPermission\("admin\.billing\.manage"\)/);
  });

  it("blocks invalid reconciliation state transitions", () => {
    assert.match(serviceSource, /ALREADY_RECONCILED/);
    assert.match(serviceSource, /INVALID_CONFIRM_TRANSITION/);
    assert.match(serviceSource, /INVALID_REJECT_TRANSITION/);
    assert.match(serviceSource, /LICENSE_REQUIRED_FOR_RECONCILIATION/);
    assert.match(serviceSource, /payment\.status !== ManualPaymentStatus\.CONFIRMED/);
    assert.match(actionsSource, /reconciliationReference/);
    assert.match(actionsSource, /reconciliationNote/);
  });
});
