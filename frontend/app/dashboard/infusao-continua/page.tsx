import { resourceAccess } from "@/components/clinical-resources/ResourceAccess";
import { ResourceFrame } from "@/components/clinical-resources/ResourceFrame";
import { InfusionCatalog } from "@/components/clinical-resources/InfusionCatalog";
import { getClinicalCatalog } from "@/lib/clinical-resources-server";

export default async function ContinuousInfusionPage() {
  const denied = await resourceAccess("infusion");
  if (denied) return denied;
  return <ResourceFrame kind="infusion"><InfusionCatalog catalog={getClinicalCatalog("infusions")} /></ResourceFrame>;
}
