/** Prefill lines for festival/eclipse card from Panchang tithi name (user-editable). */
export function suggestFestivalFromTithi(tithiName: string): { title: string; subtitle: string } {
  const t = tithiName.trim()
  const lower = t.toLowerCase()
  if (lower.includes('ekadashi')) {
    return { title: 'Ekadashi', subtitle: `${t} — fasting & Vishnu remembrance` }
  }
  if (lower.includes('purnima') || lower.includes('purnima')) {
    return { title: 'Purnima', subtitle: `${t} — full Moon observances` }
  }
  if (lower.includes('amavasya') || lower.includes('amavasya')) {
    return { title: 'Amavasya', subtitle: `${t} — pitri & inner reset` }
  }
  if (lower.includes('sashti') || lower.includes('shashthi')) {
    return { title: 'Sashti', subtitle: `${t} — Skanda / wellness focus` }
  }
  if (lower.includes('chaturthi') || lower.includes('caturthi')) {
    return { title: 'Chaturthi', subtitle: `${t} — Ganapati day` }
  }
  return { title: 'Vaidika observance', subtitle: t }
}
