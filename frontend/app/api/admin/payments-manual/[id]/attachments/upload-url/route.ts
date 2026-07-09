import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { createManualPaymentAttachmentUpload, ManualPaymentAttachmentError } from "@/lib/manual-payment-attachments";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPermission("admin.billing.manage");
  const { id } = await params;

  try {
    const body = (await request.json()) as { fileName?: string; contentType?: string; byteSize?: number };
    const upload = await createManualPaymentAttachmentUpload({
      admin,
      paymentId: id,
      fileName: body.fileName ?? "",
      contentType: body.contentType ?? "",
      byteSize: Number(body.byteSize)
    });
    return NextResponse.json(upload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao preparar upload do comprovante.";
    const status = error instanceof ManualPaymentAttachmentError && error.code === "STORAGE_NOT_CONFIGURED" ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
