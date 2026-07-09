"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission, recordAdminAuditEvent } from "@/lib/admin-permissions";
import { DEFAULT_SKIN_CACHE_TAG, DEFAULT_SKIN_SETTING_KEY, parseSkin } from "@/lib/skin";
import { prisma } from "@/lib/prisma";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

export async function updateDefaultSkinAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.operations.view");
  const skin = parseSkin(getString(formData, "skin"));
  if (!skin) redirect("/admin/system?error=Skin padrão inválida.");

  await prisma.appSetting.upsert({
    where: { key: DEFAULT_SKIN_SETTING_KEY },
    update: {
      value: skin,
      updatedByUserId: admin.id
    },
    create: {
      key: DEFAULT_SKIN_SETTING_KEY,
      value: skin,
      description: "Skin padrão global do SaaS",
      updatedByUserId: admin.id
    }
  });

  await recordAdminAuditEvent({
    actorUserId: admin.id,
    action: "admin.system.default_skin_updated",
    resourceType: "app_setting",
    resourceId: DEFAULT_SKIN_SETTING_KEY,
    outcome: "success",
    metadata: { skin }
  });

  revalidateTag(DEFAULT_SKIN_CACHE_TAG);
  revalidatePath("/admin/system");
  redirect("/admin/system?message=Skin padrão atualizada.");
}
