/** Currency → locale map and formatter, ported from sink-inventory's utils/formatMoney. */
const CURRENCY_LOCALE_MAP: Record<string, string> = {
  NGN: 'en-NG', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP', CHF: 'de-CH', CAD: 'en-CA', AUD: 'en-AU', NZD: 'en-NZ', CNY: 'zh-CN',
  INR: 'en-IN', RUB: 'ru-RU', BRL: 'pt-BR', ZAR: 'en-ZA', MXN: 'es-MX', SGD: 'en-SG', HKD: 'zh-HK', SEK: 'sv-SE', KES: 'sw-KE', GHS: 'en-GH',
}

const localeFor = (currency: string) => CURRENCY_LOCALE_MAP[currency] ?? 'en-US'

/** Pure formatter, safe anywhere: formatMoney(1260, 'NGN') → "₦1,260"; kobo is shown only when there is some ("₦1,260.50"). */
export const formatMoney = (amount: number, currency = 'NGN') => {
  const safeCurrency = currency?.toUpperCase() || 'NGN'
  const value = amount ?? 0
  return new Intl.NumberFormat(localeFor(safeCurrency), { style: 'currency', currency: safeCurrency, minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value)
}

/** Short form for stat cards: formatMoneyCompact(248000, 'NGN') → "₦248K". */
export const formatMoneyCompact = (amount: number, currency = 'NGN') => {
  const safeCurrency = currency?.toUpperCase() || 'NGN'
  return new Intl.NumberFormat(localeFor(safeCurrency), { style: 'currency', currency: safeCurrency, notation: 'compact', maximumFractionDigits: 1 }).format(amount ?? 0)
}
