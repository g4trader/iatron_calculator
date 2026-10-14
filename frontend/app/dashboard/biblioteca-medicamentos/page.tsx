import { resourceAccess } from "@/components/clinical-resources/ResourceAccess";
import { ResourceFrame } from "@/components/clinical-resources/ResourceFrame";
import { MedicationLibrary } from "@/components/clinical-resources/MedicationLibrary";
import { getClinicalCatalog } from "@/lib/clinical-resources-server";

export default async function MedicationLibraryPage() {
  const denied = await resourceAccess("library");
  if (denied) return denied;
  return <ResourceFrame kind="library"><MedicationLibrary catalog={getClinicalCatalog("medications")} /></ResourceFrame>;
}
