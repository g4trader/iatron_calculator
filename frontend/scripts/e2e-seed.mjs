import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";
import { loadOperationalEnv } from "./load-env.mjs";

loadOperationalEnv();

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);
const password = process.env.E2E_PASSWORD ?? "IatronE2E#2026";
const allowedEnvironments = new Set(["staging", "e2e", "local"]);

function assertSafeEnvironment() {
  const environment = process.env.IATRON_ENV ?? "local";
  if (!allowedEnvironments.has(environment)) {
    throw new Error(`Refusing to run E2E seed with IATRON_ENV=${environment}. Use staging, e2e or local.`);
  }
  if (process.env.NODE_ENV === "production" || environment === "production") {
    throw new Error("Refusing to run E2E seed in production.");
  }
}

const users = {
  noAccess: "e2e+no-access@iatron.test",
  active: "e2e+active@iatron.test",
  pastDue: "e2e+past-due@iatron.test",
  orgNoLicense: "e2e+org-no-license@iatron.test",
  orgLicensed: "e2e+org-licensed@iatron.test"
};

async function hashPassword(value) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scrypt(value, salt, 64);
  return ["scrypt", "default", salt, Buffer.from(derivedKey).toString("base64url")].join("$");
}

async function upsertUser(email, name) {
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      emailVerified: new Date(),
      passwordCredential: {
        create: {
          passwordHash: await hashPassword(password)
        }
      }
    },
    update: {
      name,
      emailVerified: new Date(),
      passwordCredential: {
        upsert: {
          create: { passwordHash: await hashPassword(password) },
          update: { passwordHash: await hashPassword(password) }
        }
      }
    }
  });
  return user;
}

async function ensurePlans() {
  const professional = await prisma.planCatalog.upsert({
    where: { code: "PROFESSIONAL" },
    create: {
      id: "plan_professional",
      code: "PROFESSIONAL",
      name: "Professional",
      audience: "INDIVIDUAL",
      description: "Plano individual completo.",
      minSeats: 1
    },
    update: {
      name: "Professional",
      audience: "INDIVIDUAL",
      isActive: true,
      minSeats: 1
    }
  });

  const hospital = await prisma.planCatalog.upsert({
    where: { code: "HOSPITAL" },
    create: {
      id: "plan_hospital",
      code: "HOSPITAL",
      name: "Hospital",
      audience: "INSTITUTIONAL",
      description: "Plano institucional por assento.",
      minSeats: 3
    },
    update: {
      name: "Hospital",
      audience: "INSTITUTIONAL",
      isActive: true,
      minSeats: 3
    }
  });

  const professionalMonthly = await prisma.planPrice.upsert({
    where: { id: "price_professional_monthly" },
    create: {
      id: "price_professional_monthly",
      planCatalogId: professional.id,
      billingCycle: "MONTHLY",
      intervalCount: 1,
      amountCents: 7900,
      currency: "BRL"
    },
    update: {
      planCatalogId: professional.id,
      billingCycle: "MONTHLY",
      intervalCount: 1,
      amountCents: 7900,
      currency: "BRL",
      isActive: true
    }
  });

  const hospitalCustom = await prisma.planPrice.upsert({
    where: { id: "price_hospital_custom" },
    create: {
      id: "price_hospital_custom",
      planCatalogId: hospital.id,
      billingCycle: "CUSTOM",
      intervalCount: 1,
      amountCents: null,
      currency: "BRL"
    },
    update: {
      planCatalogId: hospital.id,
      billingCycle: "CUSTOM",
      intervalCount: 1,
      amountCents: null,
      currency: "BRL",
      isActive: true
    }
  });

  return { professional, hospital, professionalMonthly, hospitalCustom };
}

async function resetFixtures() {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(users) } } });
  await prisma.organization.deleteMany({ where: { slug: { in: ["e2e-hospital-no-license", "e2e-hospital-licensed"] } } });
}

async function main() {
  assertSafeEnvironment();
  const plans = await ensurePlans();
  await resetFixtures();

  const noAccess = await upsertUser(users.noAccess, "E2E Sem Acesso");
  const active = await upsertUser(users.active, "E2E Ativo");
  const pastDue = await upsertUser(users.pastDue, "E2E Past Due");
  const orgNoLicense = await upsertUser(users.orgNoLicense, "E2E Org Sem Licença");
  const orgLicensed = await upsertUser(users.orgLicensed, "E2E Org Licenciado");

  const activeSubscription = await prisma.subscription.create({
    data: {
      ownerType: "USER",
      userId: active.id,
      plan: "PROFESSIONAL",
      planCatalogId: plans.professional.id,
      planPriceId: plans.professionalMonthly.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      seatsPurchased: 1,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  await prisma.license.create({
    data: {
      subscriptionId: activeSubscription.id,
      userId: active.id,
      status: "ACTIVE",
      assignedAt: new Date()
    }
  });

  await prisma.subscription.create({
    data: {
      ownerType: "USER",
      userId: pastDue.id,
      plan: "PROFESSIONAL",
      planCatalogId: plans.professional.id,
      planPriceId: plans.professionalMonthly.id,
      status: "PAST_DUE",
      billingCycle: "MONTHLY",
      seatsPurchased: 1
    }
  });

  const orgA = await prisma.organization.create({
    data: {
      name: "E2E Hospital Sem Licença",
      slug: "e2e-hospital-no-license",
      minimumSeats: 3,
      plan: "HOSPITAL",
      memberships: {
        create: {
          userId: orgNoLicense.id,
          role: "OWNER"
        }
      }
    }
  });
  await prisma.subscription.create({
    data: {
      ownerType: "ORGANIZATION",
      organizationId: orgA.id,
      plan: "HOSPITAL",
      planCatalogId: plans.hospital.id,
      planPriceId: plans.hospitalCustom.id,
      status: "ACTIVE",
      billingCycle: "CUSTOM",
      seatsPurchased: 3
    }
  });

  const orgB = await prisma.organization.create({
    data: {
      name: "E2E Hospital Licenciado",
      slug: "e2e-hospital-licensed",
      minimumSeats: 3,
      plan: "HOSPITAL",
      memberships: {
        create: {
          userId: orgLicensed.id,
          role: "OWNER"
        }
      }
    }
  });
  const orgSubscription = await prisma.subscription.create({
    data: {
      ownerType: "ORGANIZATION",
      organizationId: orgB.id,
      plan: "HOSPITAL",
      planCatalogId: plans.hospital.id,
      planPriceId: plans.hospitalCustom.id,
      status: "ACTIVE",
      billingCycle: "CUSTOM",
      seatsPurchased: 3
    }
  });
  await prisma.license.create({
    data: {
      subscriptionId: orgSubscription.id,
      organizationId: orgB.id,
      userId: orgLicensed.id,
      status: "ACTIVE",
      assignedAt: new Date()
    }
  });

  console.log(JSON.stringify({ ok: true, password, users }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
