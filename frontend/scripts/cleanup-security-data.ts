import { loadOperationalEnv } from "./load-env.mjs";
import { prisma } from "@/lib/prisma";

loadOperationalEnv();

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  if (process.env.IATRON_ENV === "production" && process.env.ALLOW_PRODUCTION_SECURITY_CLEANUP !== "true") {
    throw new Error("Refusing to cleanup production data without ALLOW_PRODUCTION_SECURITY_CLEANUP=true.");
  }

  const revokedSessionRetentionDays = Number(process.env.REVOKED_SESSION_RETENTION_DAYS ?? 90);
  const securityEventRetentionDays = Number(process.env.SECURITY_EVENT_RETENTION_DAYS ?? 180);
  const calculationHistoryRetentionDays = Number(process.env.CALCULATION_HISTORY_RETENTION_DAYS ?? 365);

  const [sessions, securityEvents, calculationHistory] = await Promise.all([
    prisma.userSession.deleteMany({
      where: {
        revokedAt: { lt: daysAgo(revokedSessionRetentionDays) }
      }
    }),
    prisma.securityEvent.deleteMany({
      where: {
        createdAt: { lt: daysAgo(securityEventRetentionDays) }
      }
    }),
    prisma.calculationHistory.deleteMany({
      where: {
        createdAt: { lt: daysAgo(calculationHistoryRetentionDays) }
      }
    })
  ]);

  console.log(JSON.stringify({
    ok: true,
    deleted: {
      userSessions: sessions.count,
      securityEvents: securityEvents.count,
      calculationHistory: calculationHistory.count
    }
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
