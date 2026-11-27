import "server-only";
import {prisma} from "@/lib/prisma";
import {isApprovedVersion,type ReviewState} from "@/lib/clinical-review";
import {clinicalCatalog} from "@/lib/clinical-catalog";

// The current catalog contains identifiers only, not reviewable therapeutic payloads.
// Approval is deliberately unavailable until versioned clinical content and reviewer authorization exist.
async function knownVersion(recordId:string,version:string){
 if(version==="index-v1")return clinicalCatalog.some(x=>String(x.row)===recordId);
 if(!/^sha256:[a-f0-9]{64}$/.test(version))return false;
 return !!await prisma.clinicalSourceVersion.findUnique({where:{recordId_version:{recordId,version}},select:{version:true}});
}
export async function getClinicalReviewHistory(recordId:string,version:string){
 if(!await knownVersion(recordId,version))throw new Error("Ficha ou versão desconhecida");
 return prisma.clinicalReviewEvent.findMany({where:{recordId,version},orderBy:[{reviewedAt:"desc"},{id:"desc"}],take:100});
}
export async function getClinicalReviewEligibility(recordId:string,version:string){
 const events=await getClinicalReviewHistory(recordId,version);
 const latest=events[0];
 const reviewValid=isApprovedVersion(latest?{recordId:latest.recordId,version:latest.version,state:latest.state as ReviewState,reviewerId:latest.reviewerId,reference:latest.reference,reviewedAt:latest.reviewedAt.toISOString()}:null,recordId,version);
 return {reviewValid,therapeuticEligible:false,reason:"Conteúdo terapêutico versionado e autorização clínica ainda indisponíveis"};
}

import {pageIdentity} from "@/lib/mentory/server";
export async function canReviewClinical(userId:string){return !!await prisma.adminPermissionGrant.findFirst({where:{userId,permission:"clinical.document.review",status:"ACTIVE",revokedAt:null}});}
export async function recordClinicalIndexReview(input:{recordId:string;version:string;state:string;reference:string;reason:string}){
 const actor=await pageIdentity();
 const allowed=await canReviewClinical(actor.id);
 if(!actor.admin||!allowed)throw new Error("Revisor não autorizado");
 if(!await knownVersion(input.recordId,input.version))throw new Error("Ficha ou versão desconhecida");
 if(!["in_review","correction_required","revoked"].includes(input.state))throw new Error("Decisão indisponível para índice documental");
 const reference=input.reference.trim(),reason=input.reason.trim();
 if(reference.length<3||reference.length>1000||reason.length<8||reason.length>2000)throw new Error("Referência ou justificativa inválida");
 return prisma.clinicalReviewEvent.create({data:{recordId:input.recordId,version:input.version,state:input.state,reviewerId:actor.id,reference,reason}});
}
