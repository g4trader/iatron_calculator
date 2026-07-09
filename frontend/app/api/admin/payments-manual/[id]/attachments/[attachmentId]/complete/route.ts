import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { completeManualPaymentAttachmentUpload, ManualPaymentAttachmentError } from "@/lib/manual-payment-attachments";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const admin = await requireAdminPermission("admin.billing.manage");
  const { id, attachmentId } = await params;

  try {
    const body = (await request.json().catch(() => ({}))) as { checksum?: string };
    const attachment = await completeManualPaymentAttachmentUpload({
      admin,
      paymentId: id,
      attachmentId,
      checksum: body.checksum
    });
    revalidatePath(`/admin/payments-manual/${id}`);
    return NextResponse.json({ ok: true, attachmentId: attachment.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao finalizar upload do comprovante.";
    const status = error instanceof ManualPaymentAttachmentError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
