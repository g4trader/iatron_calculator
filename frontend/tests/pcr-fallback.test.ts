import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculatePcrLocally } from "../lib/pcr-calculation-engine";

describe("PCR local fallback", () => {
  it("calculates the reference PCR response when Cloud Run is unavailable", () => {
    const result = calculatePcrLocally({ pesoKg: 15, idadeAnos: 5, idadeMeses: 2 });

    assert.equal(result.input.idadeTotalMeses, 62);
    assert.equal(result.airway.find((item) => item.id === "tubo")?.value, "5 - 5,5 - 6");
    assert.equal(result.shock.find((item) => item.id === "desfibrilacao-1")?.value, "30");
    assert.equal(result.cardiacArrest.find((item) => item.id === "epinefrina")?.volume, "1,5 ml");
  });
});
