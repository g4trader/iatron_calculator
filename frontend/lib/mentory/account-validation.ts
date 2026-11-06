import { z } from 'zod';
export const profileInput = z.object({ action: z.literal('profile'), name: z.string().trim().min(2,'Informe pelo menos 2 caracteres.').max(100,'Use até 100 caracteres.').refine(s=>!/[\u0000-\u001f\u007f]/.test(s),'Nome inválido.'), version: z.string().datetime() }).strict();
export const passwordInput = z.object({ action:z.literal('password'), currentPassword:z.string().min(1).max(128), newPassword:z.string().min(10,'A senha deve ter pelo menos 10 caracteres.').max(128), confirmation:z.string().max(128) }).strict().refine(v=>v.newPassword===v.confirmation,'As senhas não coincidem.').refine(v=>v.currentPassword!==v.newPassword,'Escolha uma senha diferente da atual.');
export const playbackRates = ['0.75','1','1.25','1.5','2'] as const;
export const playbackPreferenceKey = 'mentor-playback-rate';
