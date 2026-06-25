export const e2ePassword = process.env.E2E_PASSWORD ?? "IatronE2E#2026";

export const e2eUsers = {
  noAccess: "e2e+no-access@iatron.test",
  active: "e2e+active@iatron.test",
  pastDue: "e2e+past-due@iatron.test",
  orgNoLicense: "e2e+org-no-license@iatron.test",
  orgLicensed: "e2e+org-licensed@iatron.test"
} as const;
