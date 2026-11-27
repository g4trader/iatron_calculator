import "server-only";
import {prisma} from "@/lib/prisma";
import {isApprovedVersion,type ReviewState} from "@/lib/clinical-review";
import {clinicalCatalog} from "@/lib/clinical-catalog";

// The current catalog contains identifiers only, not reviewable therapeutic payloads.
// Approval is deliberately unavailable until versioned clinical content and reviewer authorization exist.
export async function getClinicalReviewHistory(recordId:string,version:string){
 if(!clinicalCatalog.some(x=>String(x.row)===recordId)||version!=="index-v1")throw new Error("Ficha ou versão desconhecida");
 return prisma.clinicalReviewEvent.findMany({where:{recordId,version},orderBy:[{reviewedAt:"desc"},{id:"desc"}],take:100});
}
export async function getClinicalReviewEligibility(recordId:string,version:string){
 const events=await getClinicalReviewHistory(recordId,version);
 const latest=events[0];
 const reviewValid=isApprovedVersion(latest?{recordId:latest.recordId,version:latest.version,state:latest.state as ReviewState,reviewerId:latest.reviewerId,reference:latest.reference,reviewedAt:latest.reviewedAt.toISOString()}:null,recordId,version);
 return {reviewValid,therapeuticEligible:false,reason:"Conteúdo terapêutico versionado e autorização clínica ainda indisponíveis"};
}
