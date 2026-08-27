export function formatMoney(amount: number, currency: string, locale = "en") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

export function formatDate(value: string | Date, locale = "en", timeZone = "UTC") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(new Date(value));
}
