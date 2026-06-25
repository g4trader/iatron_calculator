import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { parseAuditFilters } from "@/lib/admin-audit";
import { createExportJob, parseExportFormat, processExportJob } from "@/lib/admin-exports";
import { CRITICAL_ADMIN_ACTIONS, validateAdminStepUp } from "@/lib/admin-step-up";
import { ExportJobType } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdminPermission("admin.audit.export");
  const url = new URL(request.url);
  await validateAdminStepUp({
    admin,
    action: CRITICAL_ADMIN_ACTIONS.auditExport,
    password: url.searchParams.get("stepUpPassword"),
    resourceType: "admin_audit_export",
    metadata: { format: url.searchParams.get("format") ?? "csv" }
  });
  const format = url.searchParams.get("format") === "json" ? "json" : "csv";
  const filters = parseAuditFilters(Object.fromEntries(url.searchParams.entries()));
  const job = await createExportJob({
    admin,
    type: ExportJobType.AUDIT_EXPORT,
    format: parseExportFormat(format),
    filterPayload: filters
  });
  await processExportJob(job.id);
  return NextResponse.redirect(new URL(`/admin/exports?message=${encodeURIComponent("Exportação criada. Baixe quando estiver pronta.")}`, request.url));
}
