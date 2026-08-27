export function splitPayment(amount: number, rate: number) {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error("Invalid payment split.");
  const commission = Math.round(amount * rate * 10000) / 10000;
  return { commission, tenantPayout: Math.round((amount - commission) * 10000) / 10000 };
}
