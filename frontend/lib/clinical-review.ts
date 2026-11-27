// Pure review policy. Approval must be persisted by a trusted server, never supplied by a client.
export type ReviewState="pending_review"|"in_review"|"correction_required"|"approved"|"revoked";
export type ReviewRecord={recordId:string;version:string;state:ReviewState;reviewerId:string|null;reviewedAt:string|null;reference:string|null};
export function isApprovedVersion(record:ReviewRecord|null,recordId:string,version:string):boolean {
 return !!record&&!!recordId.trim()&&!!version.trim()&&record.recordId===recordId&&record.version===version&&record.state==="approved"&&!!record.reviewerId?.trim()&&!!record.reference?.trim()&&!!record.reviewedAt&&Number.isFinite(Date.parse(record.reviewedAt))&&Date.parse(record.reviewedAt)<=Date.now();
}
