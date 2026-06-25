import { NextResponse } from "next/server";
import { exportContentType, exportFilename, getExportJobForDownload } from "@/lib/admin-exports";
import { requireAdminPermission } from "@/lib/admin-permissions";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPermission("admin.audit.export");
  const { id } = await params;
  const download = await getExportJobForDownload(id, admin);
  if (!download) {
    return NextResponse.json({ error: "Exportação indisponível." }, { status: 404 });
  }

  return new NextResponse(download.content, {
    headers: {
      "content-type": exportContentType(download.job.format),
      "content-disposition": `attachment; filename="${exportFilename(download.job)}"`
    }
  });
}
