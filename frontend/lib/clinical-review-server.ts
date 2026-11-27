import "server-only";
import {prisma} from "@/lib/prisma";
import {validateAdminStepUp} from "@/lib/admin-step-up";
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
export async function canHomologateClinical(userId:string){return !!await prisma.adminPermissionGrant.findFirst({where:{userId,permission:"clinical.document.homologate",status:"ACTIVE",revokedAt:null}});}
export async function recordClinicalIndexReview(input:{recordId:string;version:string;state:string;reference:string;reason:string;confirmedFields?:boolean;password?:string;crm?:string;uf?:string}){
 const actor=await pageIdentity();
 const allowed=input.state==="clinical_homologated"?await canHomologateClinical(actor.id):await canReviewClinical(actor.id);
 if(!actor.admin||!allowed)throw new Error("Revisor não autorizado");
 if(!await knownVersion(input.recordId,input.version))throw new Error("Ficha ou versão desconhecida");
 if(!["in_review","correction_required","revoked","document_approved","clinical_homologated"].includes(input.state))throw new Error("Decisão indisponível para índice documental");
 const reference=input.reference.trim(),reason=input.reason.trim();
 if(reference.length<3||reference.length>1000||reason.length<8||reason.length>2000)throw new Error("Referência ou justificativa inválida");
 if(input.state==="revoked")await validateAdminStepUp({admin:actor,action:"clinical.document.revoke",password:input.password,resourceType:"clinical_review",resourceId:input.recordId});
 if(input.state==="document_approved"||input.state==="clinical_homologated"){
 if(!input.confirmedFields||input.version==="index-v1")throw new Error("A aprovação exige conferência da ficha completa.");
 const source=await prisma.clinicalSourceVersion.findUnique({where:{recordId_version:{recordId:input.recordId,version:input.version}},select:{payload:true}});
 const payload=source?.payload;
 const fields=payload&&typeof payload==="object"&&!Array.isArray(payload)&&"fields" in payload?payload.fields:null;
 if(!fields||typeof fields!=="object"||Array.isArray(fields)||Object.keys(fields).length!==11)throw new Error("Ficha incompleta.");
 await validateAdminStepUp({admin:actor,action:input.state==="clinical_homologated"?"clinical.document.homologate":"clinical.document.approve",password:input.password,resourceType:"clinical_review",resourceId:input.recordId,metadata:{version:input.version}});
 }
 if(input.state==="clinical_homologated"){
 const crm=(input.crm??"").trim(),uf=(input.uf??"").trim().toUpperCase();
 if(!/^\d{1,10}$/.test(crm)||!["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].includes(uf)||!actor.name?.trim())throw new Error("Identificação profissional inválida.");
 return prisma.$transaction(async tx=>{
 const grant=await tx.adminPermissionGrant.findFirst({where:{userId:actor.id,permission:"clinical.document.homologate",status:"ACTIVE",revokedAt:null}});
 if(!grant)throw new Error("Homologador não autorizado.");
 const latest=await tx.clinicalReviewEvent.findFirst({where:{recordId:input.recordId,version:input.version},orderBy:[{reviewedAt:"desc"},{id:"desc"}]});
 if(latest?.state!=="document_approved")throw new Error("A versão exige aprovação documental prévia.");
 const event=await tx.clinicalReviewEvent.create({data:{recordId:input.recordId,version:input.version,state:input.state,reviewerId:actor.id,reference,reason}});
 await tx.adminAuditEvent.create({data:{actorUserId:actor.id,action:"clinical.document.homologated",resourceType:"clinical_review",resourceId:event.id,metadata:{recordId:input.recordId,version:input.version,professionalName:actor.name,crm,uf,confirmedFields:true,documentApprovalId:latest.id,reference,reason}}});
 return event;
 },{isolationLevel:"Serializable"});
 }
 return prisma.$transaction(async tx=>{
 const grant=await tx.adminPermissionGrant.findFirst({where:{userId:actor.id,permission:"clinical.document.review",status:"ACTIVE",revokedAt:null}});
 if(!grant)throw new Error("Revisor não autorizado.");
 const latest=await tx.clinicalReviewEvent.findFirst({where:{recordId:input.recordId,version:input.version},orderBy:[{reviewedAt:"desc"},{id:"desc"}]});
 if(latest?.state==="clinical_homologated"&&input.state!=="revoked")throw new Error("Revogue a homologação antes de reabrir a revisão.");
 const event=await tx.clinicalReviewEvent.create({data:{recordId:input.recordId,version:input.version,state:input.state,reviewerId:actor.id,reference,reason}});
 await tx.adminAuditEvent.create({data:{actorUserId:actor.id,action:"clinical.document.decision",resourceType:"clinical_review",resourceId:event.id,metadata:{recordId:input.recordId,version:input.version,state:input.state,confirmedFields:input.confirmedFields===true}}});
 return event;
 },{isolationLevel:"Serializable"});
}
