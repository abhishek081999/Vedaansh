// Hindi text for analyzeDashaGochar() (src/lib/engine/dasha/vimshottariGochar.ts)
// and buildUpcomingVimshottariTimeline() (src/lib/engine/dasha/vimshottariTimeline.ts).

export const GOCHAR_HI = {
  layer: { MD: 'महादशा', AD: 'अंतर्दशा', PD: 'प्रत्यंतर' } as Record<string, string>,
  lagnaLabel: 'लग्न पर {t}',
  lagnaDetail: '{t} लग्न ({sign}, भाव {house}) पर गोचर कर रहा है। इससे दशा के पूरे फल पर {t} के गोचर का रंग चढ़ता है।',
  moonLabel: 'चंद्र पर {t}',
  moonDetail: '{t} जन्म चंद्र की राशि पर गोचर कर रहा है। चल रही महादशा और अंतर्दशा में मन और भावनाओं के विषय मुखर होते हैं।',
  overLabel: '{layer} स्वामी पर {t}',
  overDetail: '{t} {sign} में जन्म के {lord} ({layer}) पर गोचर कर रहा है। यह गोचर दशा स्वामी के भावों को गर्म करता है।',
  aspLabel: '{t} की {layer} स्वामी पर दृष्टि',
  aspDetail: 'भाव {house} में गोचर कर रहा {t} जन्म के {lord} ({layer}) पर दृष्टि डालता है। शास्त्रीय रूप से यह दशा और गोचर के संयुक्त ट्रिगर का उम्मीदवार है।',
  selfLabel: '{layer} स्वामी का भाव {house} में गोचर',
  selfDetail: 'सक्रिय {layer} स्वामी {t} अभी लग्न से भाव {house} में गोचर कर रहा है। यह दशा ग्रह का जीवंत गोचर है।',
  summary: 'दशा × गोचर: {hits}।',
  summaryNone: 'अभी महादशा, अंतर्दशा, चंद्र या लग्न पर गुरु, शनि, राहु या केतु का कोई बड़ा गोचर प्रभाव नहीं है — दशा फिर भी चल रही है; गोचर का स्वर शांत है।',
}

export const TIMELINE_HI = {
  setup: 'तैयारी / छिद्र',
  transition: 'परिवर्तन / छिद्र',
  supportive: 'सहायक रंग',
  caution: 'सावधानी का रंग',
  mixed: 'मिश्रित रंग',
  now: 'अभी · {tone}',
  nextMaha: 'अगली महादशा',
  currentAntar: 'वर्तमान {lord} अंतर्दशा',
  antar: '{lord} अंतर्दशा',
  antarInMaha: '{lord} अंतर्दशा ({maha} महादशा)',
  maha: '{lord} महादशा',
  headCurrent: 'वर्तमान अंतर्दशा {date} तक',
  headNext: 'अगली अंतर्दशा {label}, {date} से',
  headNextMaha: 'अगली महादशा {lord}, {date} से',
  none: 'इस सीमा में आगे कोई विंशोत्तरी अवधि नहीं।',
}
