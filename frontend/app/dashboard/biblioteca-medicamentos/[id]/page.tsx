import Link from "next/link";
import { notFound } from "next/navigation";
import { resourceAccess } from "@/components/clinical-resources/ResourceAccess";
import { ResourceFrame } from "@/components/clinical-resources/ResourceFrame";
import { DocumentDetail } from "@/components/clinical-resources/DocumentDetail";
import { getClinicalCatalog } from "@/lib/clinical-resources-server";

export default async function MedicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const denied = await resourceAccess("library");
  if (denied) return denied;
  const { id } = await params;
  const catalog = getClinicalCatalog("medications");
  const entry = catalog.entries.find(item => item.id === id);
  if (!entry) notFound();
  return <ResourceFrame kind="library"><Link className="cr-back" href="/dashboard/biblioteca-medicamentos">← Voltar à biblioteca</Link><div className="cr-dedicated"><DocumentDetail entry={entry} catalog={catalog} heading="h1" /></div></ResourceFrame>;
}
