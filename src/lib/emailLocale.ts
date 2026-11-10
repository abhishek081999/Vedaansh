// Hindi copy for user-facing transactional mail.
// English bodies stay in email.ts and are used whenever lang is 'en'.

export const EMAIL_HI = {
  footerPlatform: 'पेशेवर ज्योतिष मंच',
  footerTagline: 'प्राचीन ज्ञान और आधुनिक तकनीक से सटीक वैदिक दृष्टि।',

  verifySubject: (app: string) => `अपना ईमेल सत्यापित करें — ${app}`,
  verifyTitle: (app: string) => `${app} में स्वागत है`,
  verifyBody: 'खोजकर्ताओं के इस समुदाय से जुड़ने के लिए धन्यवाद। खाते की सुरक्षा के लिए नीचे अपना ईमेल सत्यापित करें।',
  verifyButton: 'ईमेल सत्यापित करें',
  verifyFoot: 'यह लिंक 24 घंटे में समाप्त हो जाएगा। यदि आपने खाता नहीं बनाया, तो इस पत्र को अनदेखा कर सकते हैं।',

  resetSubject: (app: string) => `पासवर्ड रीसेट करें — ${app}`,
  resetTitle: 'पासवर्ड रीसेट का अनुरोध',
  resetBody: 'हमें आपका पासवर्ड रीसेट करने का अनुरोध मिला। नया पासवर्ड चुनने के लिए नीचे का बटन दबाएँ। यह लिंक 1 घंटे में समाप्त हो जाएगा।',
  resetButton: 'मेरा पासवर्ड रीसेट करें',
  resetFoot: 'यदि आपने यह परिवर्तन नहीं माँगा, तो इस पत्र को अनदेखा कर सकते हैं। आपका पासवर्ड वही रहेगा।',

  welcomeSubject: (plan: string, app: string) => `${plan} पहुँच में स्वागत — ${app}`,
  welcomeTitle: 'सदस्यता सक्रिय',
  welcomeBody: (plan: string) =>
    `आपकी <strong>${plan}</strong> सदस्यता अब सक्रिय है। पेशेवर वर्ग कुंडलियाँ, उन्नत दशाएँ और सटीक गणनाएँ खुल गई हैं।`,
  welcomeDetails: 'सदस्यता विवरण',
  welcomeTier: 'स्तर:',
  welcomeRenewal: 'नवीनीकरण तिथि:',
  welcomeButton: 'डैशबोर्ड खोलें',
  welcomeClose: 'आपकी ज्योतिष यात्रा में साथ देना हमारे लिए सम्मान है।',

  chartSubject: (name: string) => `आपका ज्योतिष मास्टर दस्तावेज़ — ${name}`,
  chartHello: 'नमस्ते,',
  chartBody: (name: string) =>
    `कृपया <strong>${name}</strong> के लिए आपका पेशेवर <strong>ज्योतिष मास्टर दस्तावेज़</strong> संलग्न पाएँ।`,
  chartDetail:
    'इस विस्तृत प्रतिवेदन में राशि और नवांश, विम्शोत्तरी दशा, ग्रह बल (षड्बल) और ज्योतिष-वास्तु संकेत हैं।',
  chartRegards: 'सादर,',
  chartSent: 'वेदांश ज्योतिष मंच से भेजा गया।',

  paymentSubject: (plan: string, app: string) => `हमें आपका ${plan} अनुरोध मिल गया — ${app}`,
  paymentTitle: 'आपका अनुरोध मिल गया',
  paymentBody: (plan: string, interval: string, method: string) =>
    `<strong>${plan}</strong> (${interval}) चुनने के लिए धन्यवाद। हमारी टीम <strong>${method}</strong> के भुगतान विवरण ईमेल करेगी, आमतौर पर 1–2 कार्यदिवसों में।`,
  paymentNext: 'भुगतान की पुष्टि होते ही हम योजना सक्रिय करेंगे और आपको पुष्टि पत्र मिलेगा।',
  paymentFoot: 'जब तक हमसे समाचार न मिले, कुछ भुगतान न करें। यदि आपने यह अनुरोध नहीं किया, तो इस पत्र को अनदेखा कर सकते हैं।',

  plans: {
    free: 'फ्री',
    gold: 'गोल्ड',
    platinum: 'प्लैटिनम',
  } as Record<string, string>,
  intervals: {
    monthly: 'मासिक',
    yearly: 'वार्षिक',
    month: 'मासिक',
    year: 'वार्षिक',
  } as Record<string, string>,
  methods: {
    paypal: 'PayPal',
    wise: 'वाइज़ ट्रांसफर',
    upi: 'यूपीआई',
    bank: 'बैंक ट्रांसफर',
    other: 'अन्य',
  } as Record<string, string>,
}
