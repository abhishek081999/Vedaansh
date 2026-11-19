# Lal Kitab — advanced, complete section plan

Status: **approved plan** (2026-11-19). Phases 0–3 done; Phase 4 next.

Open research items (need the 1952 text before they are set):
- Rahu/Ketu exaltation and debilitation houses (`LK_NODE_DIGNITY_PENDING`); the common Ketu table puts house 6 as both pakka ghar and neech.
- Gupt (hidden) and achanak-chot (sudden blow) house pairs.
- Dhokha grah moves to Phase 6, since it is read from the Varshphal chart.
- Rules tagged `edition: 'commentary'` (waking-planet table, andhi/ratandh conditions, kismat method, four masnui readings) to be confirmed or replaced.
- The 108 planet-in-house readings and the 63 Nishaniyan signs are written from karakas and house meanings (`LK_PHAL_EDITION`, `LK_NISHANI_EDITION` = commentary); check each against the 1952 text, and add per-reading conditions where the book gives them.

## Context

The user wants a full Lal Kitab (लाल किताब) section in **Advanced Astrology** covering everything the system has: every chart rule, every prediction, every remedy, and the "decoded" concepts (sleeping planets, debts, artificial planets, blind charts, signs in life, the 120-year Varshphal). Today the repo has no Lal Kitab code. The only mention is one teaching note in `src/lib/engine/vaarTeaching.ts`. This document replaces the earlier first-pass plan.

Outcome: `/lal-kitab` (Hindi `/hi/lal-kitab`), a pure engine driven by a **rule catalogue stored as data**, a panel with 16 views, a remedy finder and a 43-day remedy tracker, Varshphal by year/month, full Hindi, PDF export, and an AI-prompt topic.

---

## 1. Architecture

**The key decision: rules are data, not code.** Lal Kitab has many hundreds of conditional rules ("planet X in house Y is good if house Z is empty, bad if enemy W aspects it"). Hard-coding each in `if` chains would be unmaintainable. Instead:

```
lalKitab/
  facts.ts        chart → LkFacts (houses, aspects, sleeping, empty, conjunctions …) computed once
  conditions.ts   small condition DSL + evaluator: inHouse, with, aspectedBy, houseEmpty,
                  isSleeping, isKayam, enemyIn, friendIn, age>=, varshYear, all/any/not
  catalogue/      rules as typed data: { id, when, effect, weight, area[], source, edition }
  evaluate.ts     run catalogue over facts → ranked LkFinding[] (with "why" trail)
  read.ts         readLalKitab(chart, { lang, ageYears?, focus? }) → LalKitabReading
```

Every finding carries a **why trail** (the conditions that matched), so the UI can explain each prediction. Display text is keyed by rule id in `catalogue/*.en.ts` and `locale/lalKitab*.hi.ts`, so Hindi swaps text only. Compare on ids, never on text.

**Runs client-side** on the `ChartOutput` from `ChartProvider`, like Nadi (`src/app/nadi/page.tsx`, `src/lib/engine/nadi/read.ts`). Server routes are only for the remedy tracker and PDF export.

**Content source and copyright.** Default edition 1952 (Pt. Roop Chand Joshi), variants tagged `edition: '1939' | '1940' | '1941' | '1942' | '1952' | 'commentary'`. The book is still under copyright in India, so all text is **written in our own words**. Rules and facts are restated, never copied. Every catalogue file starts with a header saying which edition it follows.

---

## 2. Everything the engine covers

### A. Chart (Teva) foundations — `chart.ts`, `pakkaGhar.ts`, `friendship.ts`
- **Lal Kitab Teva**: each planet keeps its house from the lagna, then signs are dropped and house 1 is always read as Aries. Also a Chandra Teva (Moon's sign as house 1).
- **Pakka ghar** (permanent houses), **uchha/neech by house**, and **mushtarka (shared) houses**.
- **Lal Kitab friendship table** (it differs from Parashari) and per-house enemy/friend clashes.
- **Karakatva tables** for each planet: relatives, body parts, colours, items, animals, trees, professions, metals and directions, and the same for each house. These feed predictions, signs and remedies.
- **House meanings** in Lal Kitab terms (1 throne, 2 temple and in-laws, 4 mother and milk, 6 maternal family, 8 cremation ground, 12 bed and expenses) and the **empty-house rules** (results of a house passing through another house when it is empty).

### B. Drishti and planet interplay — `drishti.ts`, `conjunctions.ts`
- Aspects: full (1→7, 4→10), half (3→9, 3→11, 5→9), quarter (2→6, 6→12), **takkar** (collision, 1→8 type), **bunyad** (foundation house of each house), **gupt** (hidden) and **achanak chot** (sudden-blow) house pairs.
- **36 two-planet conjunction results** (9C2) and the main three-planet combinations.
- **Sath (company) effects**: a planet taking on the nature of the one sitting with it.

### C. Decoded planet and chart states — `states.ts`
- **Soya ghar / soya grah** (sleeping house or planet) and the **jagane wala grah** (the planet that wakes it), with what to do to wake it.
- **Kayam grah** (established, unharmed), **dharmi grah / dharmi teva** (pious, harmless), **dhokha grah** (deceptive), **andhe grah** (blind planets).
- **Kismat ka grah** (the planet of destiny) and the **planet that ripens fortune**.
- **Rashi phal vs grah phal**: whether a planet gives a fixed result or one that depends on the chart.
- Chart types: **andhi teva** (blind chart), **ratandh** (night-blind), **nabalig teva** (minor: kendras empty, results after age 12), **dharmi teva**, **kayam teva**.

### D. Masnui (artificial) planets — `masnui.ts`
- The full list of conjunction-made planets (Su+Ve→Ju, Su+Ju→Mo, Me+Ve→Su, Ju+Ra→Me, Sa+Ma→Ra, Ve+Ju→Sa, and the rest), whether each is good or bad, and its effect in the house where it forms.

### E. Doshas the Lal Kitab way — `doshas.ts`
- **Pitra dosh**, **grahan dosh** (Su/Mo with Ra/Ke), **Mangal badh / Mangal nek** (bad or good Mars, including Su+Sa or Mo+Ma forming bad Mars), **Lal Kitab Manglik**, the Lal Kitab view of **Kaal Sarp**, **Shani saap** (Saturn's curse), **Chandra-Rahu**, **Guru chandal**.

### F. Rin (karmic debts) — `rin.ts`
All the debts, each with trigger houses and planets, signs in life, who in the family pays, and the **shared family remedy** (money collected from each relative):
Pitri (ancestral), Matri (mother), Stri (wife), Bhai/Bandhu (brother/friend), Rishtedari (relatives), Putri/Behan (daughter/sister), Zalim (oppressor), Ajanma (unborn), Kudrati/Daivik (divine), plus the self and nature debts as listed in the chosen edition.

### G. Predictions — `catalogue/phal/*`
- **108 planet-in-house readings** (9 × 12). Each has good results, bad results, the conditions that switch between them, the age the result ripens, the relatives affected, and remedies and prohibitions.
- **Life-area predictions** built by combining rules: wealth, career and business, marriage and spouse, children, health (organs, from the karaka tables), property and vehicles, education, travel and abroad, siblings, parents, enemies and court cases, longevity, spiritual life. Longevity and death-related rules are shown carefully worded (see §6).
- **Nishaniyan (signs in life)**: physical and household signs that a planet is bad (Saturn bad → a house wall cracks, eyebrow hair falls; Jupiter bad → head-hair loss, false accusations; …). These are used both as predictions and for **chart verification**.

### H. Time — `age.ts`, `varshphal.ts`, `data/varshphalTable.ts`
- **Planet maturity ages** (Ju 16, Su 22, Mo 24, Ve 25, Ma 28, Me 34, Sa 36, Ra 42, Ke 48).
- **The 35-year cycle** of planet rule (Sa 6, Ra 6, Ke 3, Ju 6, Su 2, Mo 1, Ve 3, Ma 6, Me 2), repeating, with the running planet and the next one.
- **Varshphal**: the 120-row house-shift table builds the chart for any year. It covers the **lord of the year**, the planets that matter that year, and year predictions from the same rule catalogue with `varshYear` facts.
- **Masphal / dinphal**: the month and day charts from the year chart, by the edition's shifting rule.
- **Life timeline**: age 1–120, marking ripening ages, the cycle planet, and good or hard Varshphal years.

### I. Remedies (Upay) — `catalogue/upay/*`, `remedies.ts`
- **Per planet × house remedies** (108 sets) and **general planet remedies**.
- **Per debt**, **per dosha**, **per masnui planet**, **per Varshphal year**, and **waking remedies** for sleeping houses.
- **Problem-based remedies**: marriage delay, no children, job loss, business loss, debt, illness, court case, going abroad, education, family quarrels, house or property, bad dreams. The finder maps each problem to the chart's planets first, then to the remedy.
- **Remedy kinds** as tags: flow in water, bury, keep with you, donate, feed (crow, dog, cow, fish, ants), wear, serve a person, avoid. Each also carries a cost and difficulty tag.
- **Prohibitions (parhez)** per planet × house: what not to do, eat, accept or keep.
- **Remedy rules engine**: start in daylight; no Saturday-night or eclipse starts unless the rule says so; 40/43 days in a row, restart if broken; one remedy per planet at a time; never treat a planet that is already good; don't do it for someone else unless the rule says a relative can; **conflict check** (a remedy that helps one planet but hurts another in this chart gets blocked with the reason).
- Ranked output: the 3–5 remedies that matter most for this chart, then the full list.

### J. Teva without birth time (later phase) — `tevaCorrection.ts`
- Lal Kitab's way of building or checking a chart from life facts: the user answers questions from the Nishaniyan catalogue, the engine scores candidate placements (and a ±2 hour lagna window) and suggests the likeliest Teva. This is the "decoded" feature that most apps lack.

---

## 3. UI — `src/components/ui/LalKitabPanel.tsx` + `src/components/ui/lalKitab/*`

Built like `NadiPanel.tsx`: a `VIEWS` array, `'use client'`, CSS vars, the `userPlan` prop and `PlanGate` (`src/components/ui/patterns/PlanGate.tsx`). It reuses `NorthIndianChakra` / `ChakraSelector` (`src/components/chakra/`), shared viz (`src/components/ui/viz`: `Heatmap` for the drishti grid, `TimelineBand` for the life timeline, `Gauge` for planet state), and `ChartContextBar`.

| View | Content | Free | Gold+ |
|---|---|---|---|
| Teva | LK chart / Lagna / Chandra toggle, badges (pakka, uchha/neech, sleeping, kayam, dharmi, masnui, dhokha) | ✓ | ✓ |
| Overview | Chart type, top findings, running cycle planet, active debts and doshas | ✓ | ✓ |
| Planets | 9 cards: result, why trail, ripening age, karakas | 2 cards | ✓ |
| Houses | 12 houses: occupants, aspects, sleeping/awake, waking planet, empty-house effect | — | ✓ |
| Drishti | Aspect matrix + takkar, bunyad, gupt, achanak chot | — | ✓ |
| Conjunctions & Masnui | Pairs, artificial planets | — | ✓ |
| Doshas | Pitra, grahan, Mangal badh, LK Manglik, Kaal Sarp … | names | ✓ |
| Rin | Each debt: trigger, signs, family remedy | names | ✓ |
| Predictions | By life area, each with why trail | 1 area | ✓ |
| Nishaniyan | Tick the signs you see → which planets are confirmed bad | ✓ | ✓ |
| Varshphal | Age slider 1–120, year chart, lord of year, predictions, month view | current year summary | ✓ |
| Timeline | Life timeline 1–120 | — | ✓ |
| Remedies | Top remedies, full list, prohibitions, rules, printable checklist | 1 remedy | ✓ |
| Remedy finder | Pick a problem → chart-aware remedies | — | ✓ |
| Remedy tracker | Start a 43-day remedy, daily tick, restart on a miss | — | ✓ (saved) |
| Learn | Rules, house meanings, glossary, how to read the chart | ✓ | ✓ |

Teva correction (§2J) is its own view, added in Phase 8 (Gold).

Entry points: the sidebar (`ADVANCED_ASTRO_TABS` in `src/lib/ui/navConfig.ts`, after Nadi), mobile (`MOBILE_DASHBOARD_OPTIONS.advanced` in `src/lib/ui/chartTabRegistry.ts`), and a one-line link from the Interpretation hub.

---

## 4. Server pieces

| Piece | Path | Notes |
|---|---|---|
| Remedy tracker model | `src/lib/db/models/LalKitabRemedy.ts` | userId, chartId, ruleId, startedAt, days[], status. Index on userId+chartId. |
| Tracker API | `src/app/api/lal-kitab/remedies/route.ts` (+ `[id]`) | `guardRoute(req, routeSecurityPresets.*())` → Zod `safeParse` → `requirePlanGate(userId, 'gold')` (`src/lib/security/planAccess.ts`) → `{ success, error }`. |
| Export | `src/app/api/lal-kitab/export/route.ts` + `src/lib/pdf/lalKitabHtml.ts` (+ `.hi.ts`) | Pattern from `src/lib/pdf/chartHtml.ts` / `generateChartHTML(lang)`. Gold. |
| Platinum email | add a Lal Kitab block to the chart email | Uses `emailLocale.ts`. |
| AI prompt | add `'lalKitab'` to `AI_TOPICS` in `src/lib/engine/aiPromptTopics.ts` and a `buildTopicStudy` case | Keep its imports ephemeris-free (it runs in the browser). |

Docs: `docs/API.md` (new routes), `docs/DATA_MODEL.md` (new collection), `SUBSCRIPTION_MATRIX.md` row.

---

## 5. Hindi

Ships with each phase. Engine builders take `lang: EngineLang` (`src/lib/engine/lang.ts`). Hindi rule text goes in `src/lib/engine/locale/lalKitab*.hi.ts` keyed by rule id, UI text in `messages/{en,hi}/lalKitab.json`, and `'lalKitab'` is added to `src/i18n/messages.ts`. Pages wrap the panel in `<IntlScope namespaces={['lalKitab']}>`. Lal Kitab terms (टेवा, पक्का घर, सोया घर, कायम ग्रह, मसनूई ग्रह, ऋण, उपाय, परहेज़, निशानियाँ, वर्षफल) go into `src/i18n/jyotish.ts`. The SEO pieces are `intro-content.hi.ts`, `search-index{,.hi}.ts`, `guides{,.hi}.ts`, `sitemap.ts` and OG `?lang=hi`.

---

## 6. Safety copy

- Remedies are shown as traditional practices, with a short note that they are not medical, legal or financial advice.
- Longevity and death rules are worded as "a hard period for health; take care", never as a date. Rules about the death of relatives get the same care.
- No remedy asks the user to harm animals or people, or to spend large sums. Rules from the book that do are left out or softened, and tagged as such.

---

## 7. Phases (one PR each, off `dev`)

| # | Phase | Main files | Content volume |
|---|---|---|---|
| 0 | Rewrite `docs/plans/LAL_KITAB.md` from this plan; research sheet comparing editions | docs | — |
| 1 | **Foundation**: route, nav, messages, `facts.ts`, `conditions.ts`, `evaluate.ts`, chart, pakka ghar, friendship, karakas, house rules, drishti; Teva + Learn views | engine core, `src/app/lal-kitab/*` | ~150 facts |
| 2 | **States & combinations**: sleeping/waking, kayam, dharmi, dhokha, andhe, kismat; 36 conjunctions; masnui; chart types; Overview, Planets, Houses, Drishti, Conjunctions views | `states.ts`, `masnui.ts`, `conjunctions.ts` | ~120 rules |
| 3 | **Predictions**: 108 planet-house readings, life-area synthesis, Nishaniyan catalogue + checker; Predictions + Nishaniyan views | `catalogue/phal/*` | ~108 readings + ~150 signs |
| 4 | **Doshas & debts**: doshas, all rin; Doshas + Rin views | `doshas.ts`, `rin.ts` | ~20 rules |
| 5 | **Remedies**: all remedy sets, prohibitions, rules engine, conflict check, problem finder; Remedies + Finder views | `catalogue/upay/*`, `remedies.ts` | ~108 sets + ~30 problems |
| 6 | **Time**: ages, 35-year cycle, 120-year Varshphal table, masphal/dinphal, life timeline; Varshphal + Timeline views | `age.ts`, `varshphal.ts`, `data/varshphalTable.ts` | 120×12 table |
| 7 | **Reach**: tracker model + API, export route + HTML, Platinum email block, AI-prompt topic, SEO, OG, guide, docs, changelog | §4 | — |
| 8 | **Teva correction** from life signs (§2J) | `tevaCorrection.ts` + view | — |

Hindi text and HiLeak tests land inside each phase, not at the end.

---

## 8. Verification

Per phase:
```
npm run typecheck && npm run lint && npm run test:engine
```

Tests (`__tests__/engine/`, no redis/mongoose/next-auth imports in engine tests, following `nadiFoundations.test.ts`):
- `lalKitabConditions.test.ts`: every DSL operator, with `all/any/not` nesting.
- `lalKitabChart.test.ts`: fixed-Aries placement, Chandra kundli, from `__tests__/fixtures` charts.
- `lalKitabStates.test.ts`, `lalKitabMasnui.test.ts`, `lalKitabRin.test.ts`, `lalKitabDosha.test.ts`: a positive and a negative chart per rule.
- `lalKitabCatalogue.test.ts`: every rule id is unique, has en and hi text, a valid condition, an edition tag; 108 readings are present; every remedy referenced exists.
- `lalKitabRemedies.test.ts`: conflict check blocks a remedy that hurts another planet; "already good" planets get no remedy.
- `lalKitabVarshphal.test.ts`: 120 rows, each a permutation of 1–12; year 1 = natal; spot-checked years against the book.
- `lalKitabHiLeak.test.ts`: the full Hindi reading has no English words.
- `__tests__/security/`: tracker and export routes reject without a session, reject Free with the plan-gate response, and reject bad bodies through Zod.
- `__tests__/ui/i18n.test.ts` passes for the new namespace.

In the app: `npm run dev`, open `/lal-kitab` and `/hi/lal-kitab` in the browser pane with a saved chart. Check each view, the Free vs Gold teasers, the Varshphal slider, the remedy finder, a tracker start/tick/restart, and the PDF export, with no console errors and at mobile width.

---

## 9. Defaults taken (change any before Phase 1)

1. Edition **1952**, variants tagged.
2. URL **`/lal-kitab`**.
3. Free tier: chart, overview, Learn, Nishaniyan checker, debt and dosha names, current-year summary, 1 remedy.
4. Remedy tracker saved in MongoDB (Gold).
5. Teva correction is the last phase (8).
