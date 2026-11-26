import { Role, Prisma } from "@prisma/client";
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
    subject: "Confirme seu e-mail na Pediatron",
    text: `Confirme seu e-mail na Pediatron: ${verificationUrl}`,
    html: `<p>Confirme seu e-mail na Pediatron:</p><p><a href="${verificationUrl}">Verificar email</a></p>`
  });
}

export async function registerUser(input: { name?: string; email: string; password: string; context?: "mentory"; whatsapp?: string; termsAccepted?: boolean; privacyAcknowledged?: boolean; marketingConsent?: boolean }) {
  const email = normalizeEmail(input.email);
  auditAuthEvent("register_requested", { email });
  const existing = await prisma.user.findUnique({ where: { email }, include: { passwordCredential: true } });
  // Existing identities must use their original sign-in or recovery flow.
  if (existing) {
    return { ok: false as const, code: "EMAIL_IN_USE" as const };
  }

  const passwordHash = await hashPassword(input.password);
  let user;
  try {
    user = await prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      role: Role.USER,
      whatsapp: input.whatsapp,
      termsAcceptedAt: input.termsAccepted ? new Date() : undefined,
      privacyAcknowledgedAt: input.privacyAcknowledged ? new Date() : undefined,
      marketingConsentAt: input.marketingConsent ? new Date() : undefined,
      passwordCredential: { create: { passwordHash } }
    }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false as const, code: "EMAIL_IN_USE" as const };
    throw error;
  }

  if (input.context === 'mentory') {
    await trackFunnelEvent({ step: 'account_created', userId: user.id, source: 'mentory_registration', scope: 'mentory' });
  }
  let emailPending = false;
  try {
    const token = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(email, token);
  } catch {
    // The identity exists; a provider outage must never turn a successful registration into a duplicate-account trap.
    emailPending = true;
    auditAuthEvent("verification_email_pending", { userId: user.id });
  }
  if (input.context === "mentory") {
    const communityUrl = process.env.PEDIATRON_OPEN_COMMUNITY_URL || "https://chat.whatsapp.com/IZfXGWubm5gKO9baqP2lWa";
    await sendEmail({
      to: email,
      subject: "Bem-vindo à comunidade aberta da Pediatron",
      text: `Seu cadastro na Pediatron foi criado. Participe da comunidade aberta: ${communityUrl}\n\nA venda da Ped Expert Mentory é consultiva. Para acessar a plataforma completa, confirme seu endereço de e-mail.`
    }).catch(() => auditAuthEvent("open_community_email_pending", { userId: user.id }));
  }
  await trackFunnelEvent({ step: "account_created", userId: user.id, source: "register", scope: "account" }).catch(() => null);
  return { ok: true as const, emailPending };
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

  // A verified Mentory registration enters the manual-payment review workflow.
  // Notification failure must not undo a successful email verification.
  const intent = await prisma.funnelEvent.findFirst({
    where: { userId: storedToken.userId, step: 'account_created', source: 'mentory_registration' },
    select: { id: true }
  });
  if (intent) {
    const student = await prisma.user.findUnique({ where: { id: storedToken.userId }, select: { name: true, email: true } });
    const managers = await prisma.mentoryRoleGrant.findMany({
      where: { role: { in: ['mentory_enrollment_manager', 'mentory_admin'] } },
      select: { user: { select: { email: true } } }
    });
    const { sendEmail } = await import('@/lib/email');
    const destinations = Array.from(new Set(managers.map(m => m.user.email).filter((email): email is string => Boolean(email))));
    await Promise.allSettled(destinations.map(to => sendEmail({
      to,
      subject: 'Pediatron — novo cadastro verificado',
      text: `Novo cadastro verificado: ${student?.name || 'Aluno'} (${student?.email || 'sem e-mail'}). Consulte a fila em https://www.pediatron.com.br/mentory/admin/alunos. A contratação é consultiva; não ative sem confirmação do pagamento.`
    })));
  }
  auditAuthEvent("email_verified", { userId: storedToken.userId });
  return { ok: true as const, mentory: Boolean(intent) };
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
    subject: "Redefina sua senha do iatron.PED",
    text: `Acesse este link para redefinir sua senha no iatron.PED: ${resetUrl}`,
    html: `<p>Acesse este link para redefinir sua senha no iatron.PED:</p><p><a href="${resetUrl}">Redefinir senha</a></p>`
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
