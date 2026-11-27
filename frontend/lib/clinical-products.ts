export const CLINICAL_PRODUCTS = ["pcr","modelo-prescricao","doses-medicacoes","soroterapia","intubacao-rapida"] as const;
export type ClinicalProduct = typeof CLINICAL_PRODUCTS[number];
export function isClinicalProduct(value: unknown): value is ClinicalProduct { return typeof value === "string" && CLINICAL_PRODUCTS.some(p=>p===value); }
export function isProductLicenseValid(license:{clinicalProduct:string|null;status:string;startsAt:Date|null;endsAt:Date|null;revokedAt:Date|null},product:ClinicalProduct,now=new Date()){return license.clinicalProduct===product&&license.status==="ACTIVE"&&!license.revokedAt&&(!license.startsAt||license.startsAt<=now)&&!!license.endsAt&&license.endsAt>now;}

export const ACCESS_PRODUCTS = [...CLINICAL_PRODUCTS,"comunidade-fechada"] as const;
export function isAccessProduct(value:unknown):value is typeof ACCESS_PRODUCTS[number]{return ACCESS_PRODUCTS.some(p=>p===value);}
