import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getManualPaymentAttachmentDownloadUrl, ManualPaymentAttachmentError } from "@/lib/manual-payment-attachments";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const admin = await requireAdminPermission("admin.billing.manage");
  const { id, attachmentId } = await params;

  try {
    const download = await getManualPaymentAttachmentDownloadUrl({ admin, paymentId: id, attachmentId });
    return NextResponse.json(download);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao abrir comprovante.";
    const status = error instanceof ManualPaymentAttachmentError && error.code === "STORAGE_NOT_CONFIGURED" ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
