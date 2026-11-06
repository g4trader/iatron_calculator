import { z } from 'zod';

export const COMMUNITY_PRODUCT = 'mentor_whatsapp_community';
export const COMMUNITY_SETTING = 'mentory.community.v1';
export const communityDefaults = {
  enabled: false,
  inviteUrl: '',
  supportPhone: '',
  welcome: 'Continue as conversas das aulas com outros alunos, médicos e o Dr. Aristóteles nos grupos fechados da nossa comunidade.',
};
export function whatsappInvite(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'chat.whatsapp.com' || url.port || url.username || url.password || url.hash || !/^\/[A-Za-z0-9]{10,128}\/?$/.test(url.pathname)) return null;
    if (Array.from(url.searchParams.keys()).some(key => key !== 'mode')) return null;
    return `https://chat.whatsapp.com${url.pathname.replace(/\/$/, '')}`;
  } catch { return null; }
}
export const communityConfigSchema = z.object({
  enabled: z.boolean(),
  inviteUrl: z.string().trim().max(300).refine(v => !v || !!whatsappInvite(v), 'Informe um convite HTTPS válido de chat.whatsapp.com.').transform(v => v ? whatsappInvite(v)! : ''),
  supportPhone: z.string().trim().regex(/^(?:[1-9]\d{9,14})?$/, 'Informe país, DDD e número, somente dígitos.'),
  welcome: z.string().trim().min(10).max(800),
}).strict().refine(v => !v.enabled || !!v.inviteUrl, 'Cadastre o convite antes de ativar a comunidade.');
export const communitySettingsInput = z.object({
  config: communityConfigSchema,
  version: z.string().datetime().nullable(),
}).strict();
export type CommunityConfig = z.infer<typeof communityConfigSchema>;
