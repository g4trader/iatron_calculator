CREATE TYPE "AdminPermissionGrantStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "AdminPermissionGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "status" "AdminPermissionGrantStatus" NOT NULL DEFAULT 'ACTIVE',
  "reason" TEXT,
  "grantedByUserId" TEXT,
  "revokedByUserId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdminPermissionGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminPermissionGrant_userId_permission_key" ON "AdminPermissionGrant"("userId", "permission");
CREATE INDEX "AdminPermissionGrant_userId_status_idx" ON "AdminPermissionGrant"("userId", "status");
CREATE INDEX "AdminPermissionGrant_permission_status_idx" ON "AdminPermissionGrant"("permission", "status");

ALTER TABLE "AdminPermissionGrant" ADD CONSTRAINT "AdminPermissionGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminPermissionGrant" ADD CONSTRAINT "AdminPermissionGrant_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminPermissionGrant" ADD CONSTRAINT "AdminPermissionGrant_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
