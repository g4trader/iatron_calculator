// Arithmetic only. No therapeutic defaults or clinical recommendations.
export type MassUnit = "g" | "mg" | "mcg";
const factors: Record<MassUnit, number> = {g:1000,mg:1,mcg:0.001};
function positive(n:number,label:string):number {
  if(!Number.isFinite(n)||n<=0) throw new RangeError(label+" deve ser positivo e finito");
  return n;
}
function factor(unit:MassUnit):number {
  if(!Object.prototype.hasOwnProperty.call(factors,unit)) throw new RangeError("Unidade incompatível");
  return factors[unit];
}
export function convertMass(value:number,from:MassUnit,to:MassUnit):number {
  return positive(positive(value,"Massa")*factor(from)/factor(to),"Resultado");
}
export function doseVolume(input:{weightKg:number;dosePerKg:number;doseUnit:MassUnit;stockMass:number;stockUnit:MassUnit;stockVolumeMl:number}) {
  const massMg=positive(positive(input.weightKg,"Peso")*convertMass(input.dosePerKg,input.doseUnit,"mg"),"Dose");
  const concentrationMgMl=positive(convertMass(input.stockMass,input.stockUnit,"mg")/positive(input.stockVolumeMl,"Volume"),"Concentração");
  return {massMg,concentrationMgMl,volumeMl:positive(massMg/concentrationMgMl,"Volume calculado")};
}
export function volumeRate(volumeMl:number,hours:number):number {
  return positive(positive(volumeMl,"Volume")/positive(hours,"Duração"),"Velocidade");
}
export function infusionRate(input:{weightKg:number;dosePerKgPerMinute:number;doseUnit:MassUnit;totalMass:number;massUnit:MassUnit;finalVolumeMl:number}) {
  const massMgHour=positive(positive(input.weightKg,"Peso")*convertMass(input.dosePerKgPerMinute,input.doseUnit,"mg")*60,"Massa por hora");
  const concentrationMgMl=positive(convertMass(input.totalMass,input.massUnit,"mg")/positive(input.finalVolumeMl,"Volume final"),"Concentração");
  return {massMgHour,concentrationMgMl,mlHour:positive(massMgHour/concentrationMgMl,"Velocidade")};
}
