// Run privately with the original workbook and its extracted JSON. Never deploy source data in public assets.
const fs=require("node:fs");
const {createHash}=require("node:crypto");
const {PrismaClient}=require("@prisma/client");
const hash=x=>createHash("sha256").update(x).digest("hex");
const canonical=x=>x===null||typeof x!=="object"?JSON.stringify(x):Array.isArray(x)?"["+x.map(canonical).join(",")+"]":"{"+Object.keys(x).sort().map(k=>JSON.stringify(k)+":"+canonical(x[k])).join(",")+"}";
async function main(){
 const [json,workbook]=process.argv.slice(2);
 if(!json||!workbook)throw Error("Provide JSON and original workbook");
 const data=JSON.parse(fs.readFileSync(json,"utf8"));
 if(hash(fs.readFileSync(workbook))!==data.sourceSha256)throw Error("Source hash mismatch");
 if(!Array.isArray(data.records)||data.records.length!==69)throw Error("Unexpected record count");
 const ids=new Set();
 for(const r of data.records){
 const payload={source:r.source,sheet:r.sheet,row:r.row,fields:r.fields};
 if(r.sheet!=="Fichas"||!Number.isInteger(r.row)||r.row<2||r.row>70||r.recordId!==String(r.row)||ids.has(r.recordId)||r.state!=="pending_review"||r.therapeuticEligible!==false||Object.keys(r.fields).length!==11||Object.values(r.fields).some(v=>typeof v!=="string"&&v!==null)||r.version!=="sha256:"+hash(canonical(payload)))throw Error("Invalid record "+r.recordId);
 ids.add(r.recordId);
 }
 const prisma=new PrismaClient();
 try{await prisma.$transaction(async tx=>{for(const r of data.records){const payload={source:r.source,sheet:r.sheet,row:r.row,fields:r.fields};const existing=await tx.clinicalSourceVersion.findUnique({where:{recordId_version:{recordId:r.recordId,version:r.version}}});if(existing){if(canonical(existing.payload)!==canonical(payload)||existing.sourceSha256!==data.sourceSha256)throw Error("Existing version mismatch");continue;}await tx.clinicalSourceVersion.create({data:{recordId:r.recordId,version:r.version,sourceSha256:data.sourceSha256,payload}});}});console.log("69 documentary versions verified; no clinical approval granted");}finally{await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
