// ─────────────────────────────────────────────────────────────
//  src/lib/social/events/festivals.ts
//  Rules table for major Hindu festivals (lunar) + solar festivals
//  keyed off Sun ingress. Pure data — no ephemeris imports.
//
//  Conventions
//  • masa is the AMANTA lunar month (new moon → new moon), names from
//    LUNAR_MASA_NAMES. Krishna-paksha festivals therefore use the month
//    BEFORE the North-Indian purnimanta name (e.g. Diwali = Ashvina
//    Amavasya amanta = Kartika Amavasya purnimanta).
//  • tithi is 1–30 as returned by getTithi(): 1–15 Shukla (15 = Purnima),
//    16–30 Krishna (30 = Amavasya). paksha is kept for readability.
//  • observe is the instant at which the tithi must prevail:
//      sunrise  — udaya tithi (most vrats / day festivals)
//      madhyahna — midday (Ram Navami, Ganesh Chaturthi)
//      aparahna — afternoon, 4th fifth of the day (Dussehra, Bhai Dooj, Raksha Bandhan)
//      pradosh  — evening after sunset (Diwali, Dhanteras, Holika Dahan)
//      nishita  — midnight (Janmashtami, Maha Shivratri)
//      moonrise — chandrodaya (Karwa Chauth, Sankashti)
//  • Festivals falling in an Adhika (intercalary) masa are skipped.
// ─────────────────────────────────────────────────────────────

import type { LunarMasa } from '@/lib/engine/panchangVishesh'
import type { Rashi } from '@/types/astrology'

export type FestivalObserve = 'sunrise' | 'madhyahna' | 'aparahna' | 'pradosh' | 'nishita' | 'moonrise'

export interface FestivalRule {
  id:      string
  name:    string
  deva:    string
  masa:    LunarMasa
  paksha:  'shukla' | 'krishna'
  tithi:   number
  observe: FestivalObserve
  detail?: string
}

export interface SolarFestivalRule {
  id:     string
  name:   string
  deva:   string
  /** Sidereal sign the Sun enters */
  sign:   Rashi
  detail?: string
}

const S = 'shukla' as const
const K = 'krishna' as const

export const FESTIVAL_RULES: readonly FestivalRule[] = [
  // ── Chaitra ──
  { id: 'chaitra-navratri', name: 'Chaitra Navratri begins', deva: 'Durga', masa: 'Chaitra', paksha: S, tithi: 1, observe: 'sunrise', detail: 'Ghatasthapana; nine nights of the Goddess.' },
  { id: 'ugadi', name: 'Gudi Padwa & Ugadi', deva: 'Brahma', masa: 'Chaitra', paksha: S, tithi: 1, observe: 'sunrise', detail: 'Hindu lunar new year (Vikram Samvat begins).' },
  { id: 'ram-navami', name: 'Ram Navami', deva: 'Rama', masa: 'Chaitra', paksha: S, tithi: 9, observe: 'madhyahna', detail: 'Birth of Shri Rama at madhyahna.' },
  { id: 'hanuman-jayanti', name: 'Hanuman Jayanti', deva: 'Hanuman', masa: 'Chaitra', paksha: S, tithi: 15, observe: 'sunrise' },
  // ── Vaishakha ──
  { id: 'akshaya-tritiya', name: 'Akshaya Tritiya', deva: 'Lakshmi-Narayana', masa: 'Vaishakha', paksha: S, tithi: 3, observe: 'sunrise', detail: 'Imperishable merit; gold, charity and new beginnings.' },
  { id: 'narasimha-jayanti', name: 'Narasimha Jayanti', deva: 'Narasimha', masa: 'Vaishakha', paksha: S, tithi: 14, observe: 'pradosh' },
  { id: 'buddha-purnima', name: 'Buddha Purnima', deva: 'Buddha', masa: 'Vaishakha', paksha: S, tithi: 15, observe: 'sunrise' },
  { id: 'vat-savitri', name: 'Vat Savitri Vrat', deva: 'Savitri', masa: 'Vaishakha', paksha: K, tithi: 30, observe: 'sunrise', detail: 'North-Indian Jyeshtha Amavasya (purnimanta).' },
  // ── Jyeshtha ──
  { id: 'ganga-dussehra', name: 'Ganga Dussehra', deva: 'Ganga', masa: 'Jyeshtha', paksha: S, tithi: 10, observe: 'sunrise' },
  { id: 'nirjala-ekadashi', name: 'Nirjala Ekadashi', deva: 'Vishnu', masa: 'Jyeshtha', paksha: S, tithi: 11, observe: 'sunrise', detail: 'The waterless fast — merit of all 24 Ekadashis.' },
  // ── Ashadha ──
  { id: 'rath-yatra', name: 'Jagannath Rath Yatra', deva: 'Jagannath', masa: 'Ashadha', paksha: S, tithi: 2, observe: 'sunrise' },
  { id: 'devshayani-ekadashi', name: 'Devshayani Ekadashi', deva: 'Vishnu', masa: 'Ashadha', paksha: S, tithi: 11, observe: 'sunrise', detail: 'Vishnu enters yoga-nidra; Chaturmas begins.' },
  { id: 'guru-purnima', name: 'Guru Purnima', deva: 'Vyasa', masa: 'Ashadha', paksha: S, tithi: 15, observe: 'sunrise' },
  // ── Shravana ──
  { id: 'hariyali-teej', name: 'Hariyali Teej', deva: 'Parvati', masa: 'Shravana', paksha: S, tithi: 3, observe: 'sunrise' },
  { id: 'nag-panchami', name: 'Nag Panchami', deva: 'Nagas', masa: 'Shravana', paksha: S, tithi: 5, observe: 'sunrise' },
  { id: 'raksha-bandhan', name: 'Raksha Bandhan', deva: 'Vishnu', masa: 'Shravana', paksha: S, tithi: 15, observe: 'sunrise', detail: 'Tie rakhi outside Bhadra.' },
  { id: 'janmashtami', name: 'Krishna Janmashtami', deva: 'Krishna', masa: 'Shravana', paksha: K, tithi: 23, observe: 'nishita', detail: 'Krishna born at midnight on Bhadrapada Krishna Ashtami (purnimanta).' },
  // ── Bhadrapada ──
  { id: 'hartalika-teej', name: 'Hartalika Teej', deva: 'Parvati', masa: 'Bhadrapada', paksha: S, tithi: 3, observe: 'sunrise' },
  { id: 'ganesh-chaturthi', name: 'Ganesh Chaturthi', deva: 'Ganesha', masa: 'Bhadrapada', paksha: S, tithi: 4, observe: 'madhyahna', detail: 'Ten-day Ganeshotsav begins.' },
  { id: 'anant-chaturdashi', name: 'Anant Chaturdashi', deva: 'Vishnu', masa: 'Bhadrapada', paksha: S, tithi: 14, observe: 'sunrise', detail: 'Ganesh visarjan.' },
  { id: 'pitru-paksha', name: 'Pitru Paksha begins', deva: 'Pitrs', masa: 'Bhadrapada', paksha: K, tithi: 16, observe: 'sunrise', detail: 'Fortnight of shraddha for the ancestors.' },
  { id: 'mahalaya-amavasya', name: 'Mahalaya (Sarva Pitru) Amavasya', deva: 'Pitrs', masa: 'Bhadrapada', paksha: K, tithi: 30, observe: 'sunrise' },
  // ── Ashvina ──
  { id: 'sharad-navratri', name: 'Sharad Navratri begins', deva: 'Durga', masa: 'Ashvina', paksha: S, tithi: 1, observe: 'sunrise', detail: 'Ghatasthapana.' },
  { id: 'durga-ashtami', name: 'Durga Ashtami', deva: 'Durga', masa: 'Ashvina', paksha: S, tithi: 8, observe: 'sunrise' },
  { id: 'maha-navami', name: 'Maha Navami', deva: 'Durga', masa: 'Ashvina', paksha: S, tithi: 9, observe: 'sunrise' },
  { id: 'dussehra', name: 'Dussehra (Vijayadashami)', deva: 'Rama', masa: 'Ashvina', paksha: S, tithi: 10, observe: 'aparahna' },
  { id: 'sharad-purnima', name: 'Sharad Purnima', deva: 'Lakshmi', masa: 'Ashvina', paksha: S, tithi: 15, observe: 'pradosh', detail: 'Kojagari — the Moon with all sixteen kalas.' },
  { id: 'karwa-chauth', name: 'Karwa Chauth', deva: 'Parvati', masa: 'Ashvina', paksha: K, tithi: 19, observe: 'moonrise' },
  { id: 'ahoi-ashtami', name: 'Ahoi Ashtami', deva: 'Ahoi Mata', masa: 'Ashvina', paksha: K, tithi: 23, observe: 'pradosh' },
  { id: 'dhanteras', name: 'Dhanteras', deva: 'Dhanvantari & Kubera', masa: 'Ashvina', paksha: K, tithi: 28, observe: 'pradosh' },
  { id: 'narak-chaturdashi', name: 'Narak Chaturdashi (Choti Diwali)', deva: 'Krishna', masa: 'Ashvina', paksha: K, tithi: 29, observe: 'sunrise' },
  { id: 'diwali', name: 'Diwali (Lakshmi Puja)', deva: 'Lakshmi', masa: 'Ashvina', paksha: K, tithi: 30, observe: 'pradosh', detail: 'Lakshmi Puja in pradosh kaal on Kartika Amavasya (purnimanta).' },
  // ── Kartika ──
  { id: 'govardhan-puja', name: 'Govardhan Puja', deva: 'Krishna', masa: 'Kartika', paksha: S, tithi: 1, observe: 'sunrise' },
  { id: 'bhai-dooj', name: 'Bhai Dooj', deva: 'Yama & Yamuna', masa: 'Kartika', paksha: S, tithi: 2, observe: 'aparahna' },
  { id: 'chhath-puja', name: 'Chhath Puja', deva: 'Surya & Chhathi Maiya', masa: 'Kartika', paksha: S, tithi: 6, observe: 'sunrise', detail: 'Sandhya arghya to the setting Sun.' },
  { id: 'dev-uthani-ekadashi', name: 'Dev Uthani Ekadashi', deva: 'Vishnu', masa: 'Kartika', paksha: S, tithi: 11, observe: 'sunrise', detail: 'Prabodhini — Vishnu wakes; Chaturmas ends, Tulsi Vivah follows.' },
  { id: 'kartik-purnima', name: 'Kartik Purnima & Dev Deepawali', deva: 'Shiva (Tripurari)', masa: 'Kartika', paksha: S, tithi: 15, observe: 'sunrise', detail: 'Also Guru Nanak Jayanti.' },
  // ── Margashirsha ──
  { id: 'vivah-panchami', name: 'Vivah Panchami', deva: 'Sita-Rama', masa: 'Margashirsha', paksha: S, tithi: 5, observe: 'sunrise' },
  { id: 'gita-jayanti', name: 'Gita Jayanti (Mokshada Ekadashi)', deva: 'Krishna', masa: 'Margashirsha', paksha: S, tithi: 11, observe: 'sunrise' },
  { id: 'dattatreya-jayanti', name: 'Dattatreya Jayanti', deva: 'Dattatreya', masa: 'Margashirsha', paksha: S, tithi: 15, observe: 'pradosh' },
  // ── Pausha ──
  { id: 'mauni-amavasya', name: 'Mauni Amavasya', deva: 'Pitrs', masa: 'Pausha', paksha: K, tithi: 30, observe: 'sunrise', detail: 'Magha Amavasya (purnimanta); silent bath at the sangam.' },
  // ── Magha ──
  { id: 'vasant-panchami', name: 'Vasant Panchami', deva: 'Saraswati', masa: 'Magha', paksha: S, tithi: 5, observe: 'sunrise' },
  { id: 'ratha-saptami', name: 'Ratha Saptami', deva: 'Surya', masa: 'Magha', paksha: S, tithi: 7, observe: 'sunrise' },
  { id: 'maha-shivratri', name: 'Maha Shivratri', deva: 'Shiva', masa: 'Magha', paksha: K, tithi: 29, observe: 'nishita', detail: 'Phalguna Krishna Chaturdashi (purnimanta); nishita puja.' },
  // ── Phalguna ──
  { id: 'holika-dahan', name: 'Holika Dahan', deva: 'Narasimha', masa: 'Phalguna', paksha: S, tithi: 15, observe: 'pradosh' },
  { id: 'holi', name: 'Holi', deva: 'Krishna', masa: 'Phalguna', paksha: K, tithi: 16, observe: 'sunrise', detail: 'Rangwali Holi / Dhulandi.' },
]

/** Festivals fixed to the Sun's sidereal ingress (Lahiri). */
export const SOLAR_FESTIVAL_RULES: readonly SolarFestivalRule[] = [
  { id: 'makar-sankranti', name: 'Makar Sankranti', deva: 'Surya', sign: 10, detail: 'Sun enters Makara; uttarayana punya kaal.' },
  { id: 'pongal', name: 'Pongal', deva: 'Surya', sign: 10 },
  { id: 'baisakhi', name: 'Baisakhi & Mesha Sankranti', deva: 'Surya', sign: 1, detail: 'Solar new year in Punjab, Tamil Nadu, Kerala, Bengal, Odisha.' },
]

/** Name of each Ekadashi by amanta masa and paksha. */
export const EKADASHI_NAMES: Record<LunarMasa, { shukla: string; krishna: string }> = {
  Chaitra:      { shukla: 'Kamada',          krishna: 'Varuthini' },
  Vaishakha:    { shukla: 'Mohini',          krishna: 'Apara' },
  Jyeshtha:     { shukla: 'Nirjala',         krishna: 'Yogini' },
  Ashadha:      { shukla: 'Devshayani',      krishna: 'Kamika' },
  Shravana:     { shukla: 'Shravana Putrada', krishna: 'Aja' },
  Bhadrapada:   { shukla: 'Parsva',          krishna: 'Indira' },
  Ashvina:      { shukla: 'Papankusha',      krishna: 'Rama' },
  Kartika:      { shukla: 'Prabodhini',      krishna: 'Utpanna' },
  Margashirsha: { shukla: 'Mokshada',        krishna: 'Saphala' },
  Pausha:       { shukla: 'Pausha Putrada',  krishna: 'Shattila' },
  Magha:        { shukla: 'Jaya',            krishna: 'Vijaya' },
  Phalguna:     { shukla: 'Amalaki',         krishna: 'Papmochani' },
}

export const ADHIKA_EKADASHI_NAMES = { shukla: 'Padmini', krishna: 'Parama' } as const
