// Hindi display strings for src/lib/engine/transitAspects.ts

export const TRANSIT_ASPECTS_HI = {
  lagna: 'लग्न',
  grade: {
    2: 'द्वि-गोचर',
    3: 'त्रि-गोचर',
    4: 'चतुर्-गोचर',
  } as Record<number, string>,
  relation: {
    conjunction: 'युति',
    aspect: 'दृष्टि',
  } as const,
  multiSummary: '{grade} जन्म {target} पर: {lords} ({relations})।',
  eventOver: '{lord} {target} पर',
  eventAspects: '{lord} {target} पर दृष्टि',
  detailConjunct: 'गोचर {lord} {sign} में जन्म {target} ({natal}) से युति।',
  detailAspect: 'गोचर {lord} {sign} में जन्म {target} ({natal}) पर दृष्टि।',
  summaryActive: 'सक्रिय: {list}।',
  summaryActiveItem: '{grade} {target} पर',
  summaryNow: 'अभी: {list}।',
  summaryNone: 'अभी जन्म बिंदुओं पर प्रमुख गुरु/शनि/राहु/केतु दृष्टि नहीं।',
  summaryNext: 'अगला बहु-गोचर: {date} से {target} पर {grade}।',
} as const
