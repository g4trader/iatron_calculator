export const MENTORY_PRICE_CENTS = 600000;
export const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export function activeAccess(subscription: { status: string; startedAt: Date; expiresAt: Date } | null, now = new Date()) {
  return !!subscription && subscription.status === 'ACTIVE' && subscription.startedAt <= now && subscription.expiresAt > now;
}
// Six calendar months in UTC, clamped to the last day of the destination month.
export function sixMonthsAfter(start: Date) {
  const result = new Date(start);
  const day = result.getUTCDate();
  result.setUTCDate(1); result.setUTCMonth(result.getUTCMonth() + 6);
  const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, last));
  return result;
}
export function renewalQuote(subscription: { renewalPriceCents: number; renewalTermsVersion: string }) {
  if (!subscription.renewalTermsVersion || subscription.renewalPriceCents < 0) throw new Error('Contrato sem condições de renovação.');
  return { priceCents: subscription.renewalPriceCents, currency: 'BRL', termsVersion: subscription.renewalTermsVersion, automatic: false, chargeEnabled: false } as const;
}
export function exactOrder(ids: string[], current: string[]) {
  return ids.length === current.length && new Set(ids).size === ids.length && ids.every(id => current.includes(id));
}
export class MentoryError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export interface MentoryPaymentAdapter { checkout(): Promise<never>; }
export const mentoryPayment: MentoryPaymentAdapter = {
  async checkout() { throw new MentoryError(423, 'Contratação online e cobranças automáticas estão desativadas. Nenhuma cobrança foi iniciada.'); }
};
