import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { auditAuthEvent } from "@/lib/audit";
import { getClientIp } from "@/lib/auth-request";
import { trackFunnelEvent } from "@/lib/funnel";
import { checkRateLimit } from "@/lib/rate-limit";
import { createExclusiveUserSession, revokeUserSession } from "@/lib/session-control";
import type { Provider } from "next-auth/providers";

const providers: Provider[] = [];

type TemporaryUser = {
  email: string;
  password: string;
};

function getTemporaryUsers(): TemporaryUser[] {
  const users: TemporaryUser[] = [];

  if (process.env.TEMP_LOGIN_EMAIL && process.env.TEMP_LOGIN_PASSWORD) {
    users.push({
      email: process.env.TEMP_LOGIN_EMAIL.trim().toLowerCase(),
      password: process.env.TEMP_LOGIN_PASSWORD
    });
  }

  const configuredUsers = process.env.TEMP_LOGIN_USERS?.split(";") ?? [];
  for (const item of configuredUsers) {
    const separatorIndex = item.indexOf("=");
    if (separatorIndex <= 0) continue;

    const email = item.slice(0, separatorIndex).trim().toLowerCase();
    const password = item.slice(separatorIndex + 1);
    if (email && password) users.push({ email, password });
  }

  return users;
}

const temporaryUsers = getTemporaryUsers();
const temporaryLoginEnabled =
  process.env.TEMP_LOGIN_ENABLED === "true" && process.env.NODE_ENV !== "production" && temporaryUsers.length > 0;

providers.push(
  Credentials({
    id: "credentials",
    name: "Email e senha",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" }
    },
    async authorize(credentials, request) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      const ip = request ? getClientIp(request) : "unknown";
      const rateLimit = await checkRateLimit("login", ip, email);
      if (!rateLimit.allowed) {
        auditAuthEvent("rate_limited", { route: "login", ip, identifier: "provided" });
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { passwordCredential: true }
      });

      if (!user?.passwordCredential || !user.email) {
        auditAuthEvent("login_failed", { email, reason: "invalid_credentials" });
        return null;
      }
      const passwordMatches = await verifyPassword(password, user.passwordCredential.passwordHash);
      if (!passwordMatches) {
        auditAuthEvent("login_failed", { userId: user.id, reason: "invalid_credentials" });
        return null;
      }
      if (!user.emailVerified) {
        auditAuthEvent("login_failed", { userId: user.id, reason: "email_not_verified" });
        return null;
      }

      auditAuthEvent("login_succeeded", { userId: user.id });
      await trackFunnelEvent({ step: "first_login", userId: user.id, source: "auth", scope: "credentials" }).catch(() => null);
      const sessionControl = await createExclusiveUserSession(user.id, {
        ip,
        userAgent: request?.headers.get("user-agent")
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        sessionId: sessionControl.sessionId,
        sessionKey: sessionControl.sessionKey
      };
    }
  })
);

if (temporaryLoginEnabled) {
  providers.push(
    Credentials({
      id: "temporary-credentials",
      name: "Acesso temporário",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const temporaryUser = temporaryUsers.find((user) => user.email === email && user.password === password);

        if (!temporaryUser) return null;

        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: "Acesso clínico",
            role: Role.USER
          }
        });

        const sessionControl = await createExclusiveUserSession(user.id);
        await trackFunnelEvent({ step: "first_login", userId: user.id, source: "auth", scope: "temporary" }).catch(() => null);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          sessionId: sessionControl.sessionId,
          sessionKey: sessionControl.sessionKey
        };
      }
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true,
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        if (!user.id) return token;
        const sessionControl = user.sessionId && user.sessionKey
          ? { sessionId: user.sessionId, sessionKey: user.sessionKey }
          : await createExclusiveUserSession(user.id);
        token.id = user.id;
        token.role = user.role;
        token.sessionId = sessionControl.sessionId;
        token.sessionKey = sessionControl.sessionKey;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role as Role;
        session.user.sessionId = typeof token.sessionId === "string" ? token.sessionId : undefined;
      }
      return session;
    }
  },
  events: {
    signOut: async (message) => {
      const token = "token" in message ? message.token : null;
      const sessionId = typeof token?.sessionId === "string" ? token.sessionId : null;
      if (sessionId) await revokeUserSession(sessionId, "logout");
    }
  }
});
