import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
  console.error("Uso: npm run admin:promote -- email@dominio.com");
  process.exit(1);
}

try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Usuário não encontrado: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" }
  });

  console.log(`Usuário promovido para ADMIN: ${email}`);
} catch (error) {
  console.error("Erro ao promover usuário:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

