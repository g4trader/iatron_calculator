CREATE TYPE "AdminAccessStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_REVIEW');
CREATE TYPE "AdminUserRoleStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "AdminStepUpStatus" AS ENUM ('APPROVED', 'USED', 'EXPIRED', 'DENIED');

ALTER TABLE "User" ADD COLUMN "adminStatus" "AdminAccessStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE "AdminRole" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRolePermission" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminRolePermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminUserRole" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "status" "AdminUserRoleStatus" NOT NULL DEFAULT 'ACTIVE',
  "reason" TEXT,
  "grantedByUserId" TEXT,
  "revokedByUserId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminUserRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminStepUpSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userSessionId" TEXT,
  "action" TEXT NOT NULL,
  "status" "AdminStepUpStatus" NOT NULL DEFAULT 'APPROVED',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "AdminStepUpSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminRole_code_key" ON "AdminRole"("code");
CREATE INDEX "AdminRole_isSystem_idx" ON "AdminRole"("isSystem");
CREATE UNIQUE INDEX "AdminRolePermission_roleId_permission_key" ON "AdminRolePermission"("roleId", "permission");
CREATE INDEX "AdminRolePermission_permission_idx" ON "AdminRolePermission"("permission");
CREATE UNIQUE INDEX "AdminUserRole_userId_roleId_key" ON "AdminUserRole"("userId", "roleId");
CREATE INDEX "AdminUserRole_userId_status_idx" ON "AdminUserRole"("userId", "status");
CREATE INDEX "AdminUserRole_roleId_status_idx" ON "AdminUserRole"("roleId", "status");
CREATE INDEX "AdminStepUpSession_userId_action_status_idx" ON "AdminStepUpSession"("userId", "action", "status");
CREATE INDEX "AdminStepUpSession_userSessionId_action_idx" ON "AdminStepUpSession"("userSessionId", "action");
CREATE INDEX "AdminStepUpSession_expiresAt_idx" ON "AdminStepUpSession"("expiresAt");

ALTER TABLE "AdminRolePermission" ADD CONSTRAINT "AdminRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminUserRole" ADD CONSTRAINT "AdminUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminUserRole" ADD CONSTRAINT "AdminUserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminUserRole" ADD CONSTRAINT "AdminUserRole_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminUserRole" ADD CONSTRAINT "AdminUserRole_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminStepUpSession" ADD CONSTRAINT "AdminStepUpSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
