import {test} from "node:test";
import assert from "node:assert/strict";
import {convertMass,doseVolume,volumeRate,infusionRate} from "../lib/clinical-arithmetic";
test("mass conversion",()=>{assert.equal(convertMass(1,"g","mg"),1000);assert.equal(convertMass(1000,"mcg","mg"),1)});
test("synthetic dose arithmetic",()=>{assert.equal(doseVolume({weightKg:10,dosePerKg:2,doseUnit:"mg",stockMass:20,stockUnit:"mg",stockVolumeMl:5}).volumeMl,5)});
test("volume rate",()=>assert.equal(volumeRate(120,6),20));
test("synthetic infusion arithmetic",()=>assert.equal(infusionRate({weightKg:10,dosePerKgPerMinute:1,doseUnit:"mcg",totalMass:6,massUnit:"mg",finalVolumeMl:100}).mlHour,10));
test("invalid inputs",()=>{for(const n of [0,-1,NaN,Infinity])assert.throws(()=>volumeRate(100,n));assert.throws(()=>convertMass(1,"UI" as never,"mg"));assert.throws(()=>convertMass(Number.MAX_VALUE,"g","mg"));});
