import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const SKIN_COOKIE = "iatron_skin";
export const DEFAULT_SKIN_SETTING_KEY = "default_skin";
export const DEFAULT_SKIN_CACHE_TAG = "default-skin";
export const SKINS = ["dark", "light"] as const;
export type Skin = (typeof SKINS)[number];

export function parseSkin(value?: string | null): Skin | null {
  return value === "dark" || value === "light" ? value : null;
}

export function skinToPrisma(value: Skin) {
  return value === "light" ? "LIGHT" : "DARK";
}

export function skinFromPrisma(value?: string | null): Skin | null {
  if (value === "LIGHT") return "light";
  if (value === "DARK") return "dark";
  return null;
}

export const getGlobalDefaultSkin = unstable_cache(
  async (): Promise<Skin> => {
    try {
      const setting = await prisma.appSetting.findUnique({ where: { key: DEFAULT_SKIN_SETTING_KEY } });
      return parseSkin(setting?.value) ?? "dark";
    } catch {
      return "dark";
    }
  },
  ["iatron-default-skin"],
  { revalidate: 60, tags: [DEFAULT_SKIN_CACHE_TAG] }
);

export async function getServerSkin(): Promise<Skin> {
  const cookieStore = await cookies();
  const cookieSkin = parseSkin(cookieStore.get(SKIN_COOKIE)?.value);
  if (cookieSkin) return cookieSkin;

  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { skinPreference: true }
    }).catch(() => null);
    const userSkin = skinFromPrisma(user?.skinPreference);
    if (userSkin) return userSkin;
  }

  return getGlobalDefaultSkin();
}
