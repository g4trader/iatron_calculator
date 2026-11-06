-- Atualiza apenas os valores padrão para novas assinaturas da Ped Expert Mentory.
-- Não altera contratos, assinaturas ou cobranças já existentes.
ALTER TABLE "mentory_subscriptions" ALTER COLUMN "priceCents" SET DEFAULT 600000;
ALTER TABLE "mentory_subscriptions" ALTER COLUMN "renewalPriceCents" SET DEFAULT 600000;
