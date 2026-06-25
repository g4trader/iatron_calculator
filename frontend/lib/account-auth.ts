import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { addMinutes, createRawToken, hashToken } from "@/lib/token";
import { sendEmail } from "@/lib/email";
import { auditAuthEvent } from "@/lib/audit";
import { trackFunnelEvent } from "@/lib/funnel";
import { revokeAllUserSessions } from "@/lib/session-control";

const EMAIL_VERIFICATION_TTL_MINUTES = 60 * 24;
const PASSWORD_RESET_TTL_MINUTES = 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getAppUrl() {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function buildUrl(path: string, token: string) {
  const url = new URL(path, getAppUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function createEmailVerificationToken(userId: string) {
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: addMinutes(new Date(), EMAIL_VERIFICATION_TTL_MINUTES)
    }
  });

  return rawToken;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = buildUrl("/verify-email", token);
  await sendEmail({
    to: email,
    subject: "Verifique seu email no Iatron",
    text: `Acesse este link para verificar seu email no Iatron: ${verificationUrl}`,
    html: `<p>Acesse este link para verificar seu email no Iatron:</p><p><a href="${verificationUrl}">Verificar email</a></p>`
  });
}

export async function registerUser(input: { name?: string; email: string; password: string }) {
  const email = normalizeEmail(input.email);
  auditAuthEvent("register_requested", { email });
  const existing = await prisma.user.findUnique({ where: { email }, include: { passwordCredential: true } });
  if (existing?.passwordCredential) {
    return { ok: false as const, code: "EMAIL_IN_USE" as const };
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: input.name?.trim() || undefined,
      role: Role.USER,
      passwordCredential: {
        upsert: {
          create: { passwordHash },
          update: { passwordHash }
        }
      }
    },
    create: {
      email,
      name: input.name?.trim() || null,
      role: Role.USER,
      passwordCredential: {
        create: { passwordHash }
      }
    }
  });

  const token = await createEmailVerificationToken(user.id);
  await sendVerificationEmail(email, token);
  await trackFunnelEvent({ step: "account_created", userId: user.id, source: "register", scope: "account" }).catch(() => null);
  return { ok: true as const };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const storedToken = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!storedToken || storedToken.usedAt || storedToken.expiresAt < new Date()) {
    return { ok: false as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: storedToken.userId },
      data: { emailVerified: new Date() }
    }),
    prisma.emailVerificationToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() }
    })
  ]);

  auditAuthEvent("email_verified", { userId: storedToken.userId });
  return { ok: true as const };
}

export async function requestPasswordReset(emailInput: string) {
  const email = normalizeEmail(emailInput);
  auditAuthEvent("password_reset_requested", { email });
  const user = await prisma.user.findUnique({ where: { email }, include: { passwordCredential: true } });

  if (!user?.passwordCredential || !user.email) {
    return { ok: true as const };
  }

  const rawToken = createRawToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: addMinutes(new Date(), PASSWORD_RESET_TTL_MINUTES)
    }
  });

  const resetUrl = buildUrl("/reset-password", rawToken);
  await sendEmail({
    to: user.email,
    subject: "Redefina sua senha do Iatron",
    text: `Acesse este link para redefinir sua senha no Iatron: ${resetUrl}`,
    html: `<p>Acesse este link para redefinir sua senha no Iatron:</p><p><a href="${resetUrl}">Redefinir senha</a></p>`
  });

  return { ok: true as const };
}

export async function resetPassword(input: { token: string; password: string }) {
  const tokenHash = hashToken(input.token);
  const storedToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!storedToken || storedToken.usedAt || storedToken.expiresAt < new Date()) {
    return { ok: false as const, code: "INVALID_TOKEN" as const };
  }

  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction([
    prisma.passwordCredential.upsert({
      where: { userId: storedToken.userId },
      create: { userId: storedToken.userId, passwordHash },
      update: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: storedToken.userId,
        usedAt: null,
        id: { not: storedToken.id }
      },
      data: { usedAt: new Date() }
    })
  ]);

  await revokeAllUserSessions(storedToken.userId, "password_reset");
  auditAuthEvent("password_reset_completed", { userId: storedToken.userId });
  return { ok: true as const };
}

export async function resendVerificationEmail(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { passwordCredential: true }
  });

  if (!user?.passwordCredential || !user.email || user.emailVerified) {
    return { ok: true as const, status: "noop" as const };
  }

  await prisma.emailVerificationToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    data: { usedAt: new Date() }
  });

  const token = await createEmailVerificationToken(user.id);
  await sendVerificationEmail(user.email, token);
  auditAuthEvent("verification_resent", { userId: user.id });
  return { ok: true as const, status: "sent" as const };
}
