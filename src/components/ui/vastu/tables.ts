// ─────────────────────────────────────────────────────────────
//  src/components/ui/vastu/tables.ts
//  English Astro-Vastu reference tables. Ids, enums, angles and
//  colours stay stable; Hindi overlays live in tables.hi.ts.
// ─────────────────────────────────────────────────────────────

export const ZONES_16 = [
  { id: 'N',   name: 'North',            ruling: 'Me', element: 'Jal',    prana: 'Udana',  quality: 'Opportunities, Career, New Beginnings',   angle: 0 },
  { id: 'NNE', name: 'North-North-East', ruling: 'Ju', element: 'Jal',    prana: 'Prana',  quality: 'Health, Immunity, Divine Blessings',      angle: 22.5 },
  { id: 'NE',  name: 'North-East',       ruling: 'Ju', element: 'Jal',    prana: 'Prana',  quality: 'Wisdom, Clarity, Spiritual Growth',        angle: 45 },
  { id: 'ENE', name: 'East-North-East',  ruling: 'Su', element: 'Vayu',   prana: 'Vyana',  quality: 'Refreshment, Joy, Social Energy',          angle: 67.5 },
  { id: 'E',   name: 'East',             ruling: 'Su', element: 'Vayu',   prana: 'Vyana',  quality: 'Social Connectivity, Visibility, Growth',  angle: 90 },
  { id: 'ESE', name: 'East-South-East',  ruling: 'Ve', element: 'Vayu',   prana: 'Apana',  quality: 'Churning, Anxiety, Transformation',        angle: 112.5 },
  { id: 'SE',  name: 'South-East',       ruling: 'Ve', element: 'Agni',   prana: 'Apana',  quality: 'Cash Flow, Confidence, Fire Energy',       angle: 135 },
  { id: 'SSE', name: 'South-South-East', ruling: 'Ma', element: 'Agni',   prana: 'Apana',  quality: 'Strength, Confidence, Assertion',          angle: 157.5 },
  { id: 'S',   name: 'South',            ruling: 'Ma', element: 'Agni',   prana: 'Samana', quality: 'Relaxation, Fame, Social Recognition',     angle: 180 },
  { id: 'SSW', name: 'South-South-West', ruling: 'Ra', element: 'Prithvi',prana: 'Samana', quality: 'Expenditure, Disposal, Letting Go',        angle: 202.5 },
  { id: 'SW',  name: 'South-West',       ruling: 'Ra', element: 'Prithvi',prana: 'Samana', quality: 'Skills, Relationships, Stability',         angle: 225 },
  { id: 'WSW', name: 'West-South-West',  ruling: 'Sa', element: 'Prithvi',prana: 'Apana',  quality: 'Education, Savings, Discipline',           angle: 247.5 },
  { id: 'W',   name: 'West',             ruling: 'Sa', element: 'Akasha', prana: 'Vyana',  quality: 'Gains, Profits, Results of Effort',        angle: 270 },
  { id: 'WNW', name: 'West-North-West',  ruling: 'Mo', element: 'Akasha', prana: 'Udana',  quality: 'Depression, Detox, Purification',          angle: 292.5 },
  { id: 'NW',  name: 'North-West',       ruling: 'Mo', element: 'Vayu',   prana: 'Udana',  quality: 'Support, Banking, Helpful People',         angle: 315 },
  { id: 'NNW', name: 'North-North-West', ruling: 'Me', element: 'Vayu',   prana: 'Prana',  quality: 'Attraction, Sensuality, Charisma',         angle: 337.5 },
]

export const ZONES_8 = [
  { id: 'N',  name: 'North',      ruling: 'Me', element: 'Jal',    prana: 'Udana',  quality: 'Opportunities, Career',    angle: 0 },
  { id: 'NE', name: 'North-East', ruling: 'Ju', element: 'Jal',    prana: 'Prana',  quality: 'Wisdom, Spiritual Growth', angle: 45 },
  { id: 'E',  name: 'East',       ruling: 'Su', element: 'Vayu',   prana: 'Vyana',  quality: 'Social Connectivity',      angle: 90 },
  { id: 'SE', name: 'South-East', ruling: 'Ve', element: 'Agni',   prana: 'Apana',  quality: 'Cash Flow, Confidence',    angle: 135 },
  { id: 'S',  name: 'South',      ruling: 'Ma', element: 'Agni',   prana: 'Samana', quality: 'Relaxation, Fame',         angle: 180 },
  { id: 'SW', name: 'South-West', ruling: 'Ra', element: 'Prithvi',prana: 'Samana', quality: 'Skills, Relationships',    angle: 225 },
  { id: 'W',  name: 'West',       ruling: 'Sa', element: 'Akasha', prana: 'Vyana',  quality: 'Gains, Profits',           angle: 270 },
  { id: 'NW', name: 'North-West', ruling: 'Mo', element: 'Vayu',   prana: 'Udana',  quality: 'Support, Banking',         angle: 315 },
]

/* 45-Deity Vastu Purusha Mandala (Ekashitipada) ─────────────────── */
export const DEITY_MAP = [
  { id: 'shikhi',        name: 'Shikhi',        x: 8, y: 0, w: 1, h: 1, ang: [33.75,45],    wall: 'N', dwaraQ: 'average' },
  { id: 'parjanya',      name: 'Parjanya',       x: 7, y: 0, w: 1, h: 1, ang: [45,56.25],   wall: 'N', dwaraQ: 'good' },
  { id: 'jayant',        name: 'Jayant',         x: 6, y: 0, w: 1, h: 1, ang: [56.25,67.5], wall: 'N', dwaraQ: 'best' },
  { id: 'indra',         name: 'Indra',          x: 5, y: 0, w: 1, h: 1, ang: [67.5,78.75], wall: 'N', dwaraQ: 'best' },
  { id: 'surya',         name: 'Surya',          x: 4, y: 0, w: 1, h: 1, ang: [78.75,90],   wall: 'N', dwaraQ: 'good' },
  { id: 'satya',         name: 'Satya',          x: 3, y: 0, w: 1, h: 1, ang: [90,101.25],  wall: 'N', dwaraQ: 'average' },
  { id: 'bhrisha',       name: 'Bhrisha',        x: 2, y: 0, w: 1, h: 1, ang: [101.25,112.5],wall:'N', dwaraQ: 'average' },
  { id: 'antariksh',     name: 'Antariksh',      x: 1, y: 0, w: 1, h: 1, ang: [112.5,123.75],wall:'N', dwaraQ: 'good' },
  { id: 'agni',          name: 'Agni',           x: 8, y: 1, w: 1, h: 1, ang: [123.75,135],  wall: 'E', dwaraQ: 'average' },
  { id: 'pusha',         name: 'Pusha',          x: 8, y: 2, w: 1, h: 1, ang: [135,146.25],  wall: 'E', dwaraQ: 'good' },
  { id: 'vitatha',       name: 'Vitatha',        x: 8, y: 3, w: 1, h: 1, ang: [146.25,157.5],wall: 'E', dwaraQ: 'average' },
  { id: 'grihakshat',    name: 'Grihakshat',     x: 8, y: 4, w: 1, h: 1, ang: [157.5,168.75],wall: 'E', dwaraQ: 'average' },
  { id: 'yama',          name: 'Yama',           x: 8, y: 5, w: 1, h: 1, ang: [168.75,180],  wall: 'E', dwaraQ: 'bad' },
  { id: 'gandharv',      name: 'Gandharv',       x: 8, y: 6, w: 1, h: 1, ang: [180,191.25],  wall: 'E', dwaraQ: 'good' },
  { id: 'bhringraj',     name: 'Bhringraj',      x: 8, y: 7, w: 1, h: 1, ang: [191.25,202.5],wall: 'E', dwaraQ: 'average' },
  { id: 'mrigha',        name: 'Mrigha',         x: 8, y: 8, w: 1, h: 1, ang: [202.5,213.75],wall: 'E', dwaraQ: 'average' },
  { id: 'pitru',         name: 'Pitr',           x: 1, y: 8, w: 1, h: 1, ang: [213.75,225],  wall: 'S', dwaraQ: 'bad' },
  { id: 'dauvarik',      name: 'Dauvarik',       x: 2, y: 8, w: 1, h: 1, ang: [225,236.25],  wall: 'S', dwaraQ: 'average' },
  { id: 'sugriv',        name: 'Sugriv',         x: 3, y: 8, w: 1, h: 1, ang: [236.25,247.5],wall: 'S', dwaraQ: 'good' },
  { id: 'pushpadant',    name: 'Pushpadant',     x: 4, y: 8, w: 1, h: 1, ang: [247.5,258.75],wall: 'S', dwaraQ: 'best' },
  { id: 'varun',         name: 'Varun',          x: 5, y: 8, w: 1, h: 1, ang: [258.75,270],  wall: 'S', dwaraQ: 'good' },
  { id: 'asur',          name: 'Asur',           x: 6, y: 8, w: 1, h: 1, ang: [270,281.25],  wall: 'S', dwaraQ: 'bad' },
  { id: 'shosh',         name: 'Shosh',          x: 7, y: 8, w: 1, h: 1, ang: [281.25,292.5],wall: 'S', dwaraQ: 'average' },
  { id: 'papiyaksha',    name: 'Papiyaksha',     x: 0, y: 8, w: 1, h: 1, ang: [292.5,303.75],wall: 'S', dwaraQ: 'bad' },
  { id: 'roga',          name: 'Roga',           x: 0, y: 7, w: 1, h: 1, ang: [303.75,315],  wall: 'W', dwaraQ: 'bad' },
  { id: 'naga',          name: 'Naga',           x: 0, y: 6, w: 1, h: 1, ang: [315,326.25],  wall: 'W', dwaraQ: 'bad' },
  { id: 'mukhya',        name: 'Mukhya',         x: 0, y: 5, w: 1, h: 1, ang: [326.25,337.5],wall: 'W', dwaraQ: 'good' },
  { id: 'bhallat',       name: 'Bhallat',        x: 0, y: 4, w: 1, h: 1, ang: [337.5,348.75],wall: 'W', dwaraQ: 'best' },
  { id: 'soma',          name: 'Soma',           x: 0, y: 3, w: 1, h: 1, ang: [348.75,360],  wall: 'W', dwaraQ: 'best' },
  { id: 'bhujag',        name: 'Bhujag',         x: 0, y: 2, w: 1, h: 1, ang: [0,11.25],     wall: 'W', dwaraQ: 'good' },
  { id: 'aditi',         name: 'Aditi',          x: 0, y: 1, w: 1, h: 1, ang: [11.25,22.5],  wall: 'W', dwaraQ: 'average' },
  { id: 'diti',          name: 'Diti',           x: 0, y: 0, w: 1, h: 1, ang: [22.5,33.75],  wall: 'W', dwaraQ: 'average' },
  { id: 'apah',          name: 'Apah',           x: 7, y: 1, w: 1, h: 1, ang: [45,90],  inner: true },
  { id: 'apah_vatsa',    name: 'Apah-vatsa',     x: 7, y: 2, w: 1, h: 1, ang: [45,90],  inner: true },
  { id: 'aryama',        name: 'Aryama',         x: 7, y: 3, w: 1, h: 3, ang: [90,135], inner: true },
  { id: 'savita',        name: 'Savita',         x: 7, y: 6, w: 1, h: 1, ang: [90,135], inner: true },
  { id: 'savitra',       name: 'Savitra',        x: 7, y: 7, w: 1, h: 1, ang: [90,135], inner: true },
  { id: 'vivaswan',      name: 'Vivaswan',       x: 3, y: 7, w: 3, h: 1, ang: [180,225],inner: true },
  { id: 'indra_inner',   name: 'Indra',          x: 2, y: 7, w: 1, h: 1, ang: [180,225],inner: true },
  { id: 'jaya',          name: 'Jaya',           x: 1, y: 7, w: 1, h: 1, ang: [180,225],inner: true },
  { id: 'mitra',         name: 'Mitra',          x: 1, y: 3, w: 1, h: 3, ang: [270,315],inner: true },
  { id: 'rudra',         name: 'Rudra',          x: 1, y: 2, w: 1, h: 1, ang: [270,315],inner: true },
  { id: 'rajayakshma',   name: 'Rajapaksha',     x: 1, y: 1, w: 1, h: 1, ang: [270,315],inner: true },
  { id: 'prithvi_dhara', name: 'Prithvi-dhara',  x: 3, y: 1, w: 3, h: 1, ang: [0,45],   inner: true },
  { id: 'brahma',        name: 'BRAHMA',         x: 3, y: 3, w: 3, h: 3, ang: [0,360],  center: true },
]

/* Deity Descriptions (scriptural + traditional) ─────────────────── */
export const DEITY_DESC: Record<string, { desc: string; mantra: string; quality: string }> = {
  brahma:        { desc: 'The Absolute Creator — ruler of the Central Brahma Sthana. All 44 other deities radiate from this sacred center. A pure center amplifies every zone.', mantra: 'Om Brahmane Namah', quality: 'Creation, Consciousness, Cosmic Order' },
  shikhi:        { desc: 'The fire of creative impulse. Represents the spark of new ideas and pure inspiration from the cosmic ether.', mantra: 'Om Shikhine Namah', quality: 'Creativity, New Ideas, Inspiration' },
  parjanya:      { desc: 'The rain-giver deity. Brings fertility, sustenance, and the blessing of abundant rainfall into one\'s endeavors.', mantra: 'Om Parjanyaya Namah', quality: 'Fertility, Abundance, Life Force' },
  jayant:        { desc: 'The Victor — son of Indra. Activates this door position for assured victory and success in all competitive endeavors.', mantra: 'Om Jayantaya Namah', quality: 'Victory, Success, Achievement' },
  indra:         { desc: 'The King of Devas — ruler of the cardinal East direction. Bestows authority, management power, and royal patronage.', mantra: 'Om Indraya Namah', quality: 'Authority, Management, Kingship' },
  surya:         { desc: 'Solar consciousness — governs integrity, visibility, and life-force. The Sun deity establishes social connectivity and health.', mantra: 'Om Suryaya Namah', quality: 'Health, Recognition, Solar Power' },
  satya:         { desc: 'The deity of Truth. Activates goodwill, social reputation, and alignment with dharmic principles in all dealings.', mantra: 'Om Satyaya Namah', quality: 'Truth, Reputation, Social Goodwill' },
  bhrisha:       { desc: 'The deity of concentrated focus. Enables precision, intellectual clarity, and masterful execution of tasks.', mantra: 'Om Bhrishaya Namah', quality: 'Focus, Precision, Intellectual Power' },
  antariksh:     { desc: 'The Inner Space deity — governs the bridge between physical and metaphysical realms. Opens pathways for spiritual realization.', mantra: 'Om Antarikshaya Namah', quality: 'Spiritual Awareness, Inner Space, Subtle Perception' },
  agni:          { desc: 'The sacred Fire deity at the SE corner. Governs all transformative processes — digestion, metabolism, and financial flow.', mantra: 'Om Agnaye Namah', quality: 'Fire, Transformation, Cash Flow' },
  pusha:         { desc: 'The Nourisher — a solar deity who governs sustenance, progressive growth, and the ability to nourish all beings.', mantra: 'Om Pushne Namah', quality: 'Nourishment, Steady Growth, Provision' },
  vitatha:       { desc: 'The deity of versatility and creative performance. Activates skill in marketing, performance arts, and adaptability.', mantra: 'Om Vitathaya Namah', quality: 'Versatility, Performance, Marketing' },
  grihakshat:    { desc: 'The Household Manager — establishes clear boundaries, domestic order, and the energy of responsible governance.', mantra: 'Om Grihakshataya Namah', quality: 'Household Order, Boundaries, Management' },
  yama:          { desc: 'The keeper of Dharma and the god of endings. As a door deity this position is avoided; as a zone it tests karmic alignment and justice.', mantra: 'Om Yamaya Namah', quality: 'Dharma, Justice, Karmic Law' },
  gandharv:      { desc: 'The Cosmic Musician of the heavens. This zone brings bliss, entertainment, artistic talent, and the energy of divine play.', mantra: 'Om Gandharvaya Namah', quality: 'Bliss, Arts, Entertainment, Relaxation' },
  bhringraj:     { desc: 'The Great Discriminator. Governs the art of analytical thinking, sorting what serves from what must be released.', mantra: 'Om Bhringgarajaya Namah', quality: 'Analysis, Discrimination, Clarity' },
  mrigha:        { desc: 'The Seeker — the eternal spiritual hunger for knowledge, truth, and discovery. Activates curiosity and research ability.', mantra: 'Om Mrigaya Namah', quality: 'Knowledge Seeking, Curiosity, Research' },
  pitru:         { desc: 'The Ancestor Portal. Connects with lineage energy, ancestral blessings, and the deep roots of generational karma.', mantra: 'Om Pitribhyo Namah', quality: 'Ancestry, Stability, Lineage Blessings' },
  dauvarik:      { desc: 'The Divine Gatekeeper. Filters energies, people, and opportunities that enter one\'s life and sphere of influence.', mantra: 'Om Dauvarikaya Namah', quality: 'Filtering, Protection, Access Control' },
  sugriv:        { desc: 'The Supportive Friend. Represents the power of strategic alliances, networking, and mutually beneficial relationships.', mantra: 'Om Sugrivaya Namah', quality: 'Support, Networking, Strategic Alliances' },
  pushpadant:    { desc: 'The Blossoming Deity of financial abundance. This is one of the most auspicious entrance positions for business growth.', mantra: 'Om Pushpadantaya Namah', quality: 'Financial Growth, Business Success, Abundance' },
  varun:         { desc: 'Lord of Cosmic Waters — governs all contracts, promises, and righteous agreements. The deity of divine law and water.', mantra: 'Om Varunaya Namah', quality: 'Contracts, Promises, Water, Divine Law' },
  asur:          { desc: 'The deity of hidden depths and shadow energy. Represents secrecy, internal strength, and dealing with the unseen.', mantra: 'Om Asuraya Namah', quality: 'Secrecy, Internal Strength, Shadow Work' },
  shosh:         { desc: 'The Great Purifier who dries out stagnation, depression, and inertia. Powerful healing energy for removing blocks.', mantra: 'Om Shoshaya Namah', quality: 'Purification, Anti-stagnation, Depression Clearing' },
  papiyaksha:    { desc: 'The accumulation deity — represents unresolved karmic residue and mental blocks. Purification is needed in this zone.', mantra: 'Om Papiyakshaya Namah', quality: 'Karmic Clearing, Mental Block Release' },
  roga:          { desc: 'The Healing Deity — where sickness is acknowledged, faced, and transformed. As entrance, avoided; as healing zone, beneficial.', mantra: 'Om Rogaya Namah', quality: 'Healing, Disease Transformation, Vitality' },
  naga:          { desc: 'The Serpent Deity of connectivity and kundalini energy. Governs the desire to reach out and weave connections.', mantra: 'Om Nagaya Namah', quality: 'Connection, Kundalini, Serpentine Wisdom' },
  mukhya:        { desc: 'The Main Force — provides clarity of life direction and purpose. One of the auspicious western entrance positions.', mantra: 'Om Mukhyaya Namah', quality: 'Life Purpose, Direction, Clarity' },
  bhallat:       { desc: 'The Abundance Deity — bestows robust financial gains, physical health, and overflowing material prosperity.', mantra: 'Om Bhallataya Namah', quality: 'Material Abundance, Health, Financial Gains' },
  soma:          { desc: 'The Moon deity — the divine nectar (Amrita). Brings deep refreshment, emotional nourishment, and blissful contentment.', mantra: 'Om Somaya Namah', quality: 'Moon Energy, Emotional Nourishment, Bliss' },
  bhujag:        { desc: 'The Endurance deity — governs mental stamina, persistence through challenges, and serpentine wisdom of the west.', mantra: 'Om Bhujagaya Namah', quality: 'Mental Stamina, Endurance, Persistence' },
  aditi:         { desc: 'The Mother of Gods — Aditi is the boundless cosmic mother who offers divine protection and unconditional security.', mantra: 'Om Aditaye Namah', quality: 'Divine Protection, Security, Boundless Love' },
  diti:          { desc: 'The Splitter — the power of conscious discernment, healthy separation, and the ability to make empowered choices.', mantra: 'Om Ditaye Namah', quality: 'Discernment, Separation, Empowered Choice' },
  apah:          { desc: 'The Healing Water deity — governs immunity, emotional purification, and the restoration of subtle body health.', mantra: 'Om Adbhyah Namah', quality: 'Immunity, Emotional Healing, Purification' },
  apah_vatsa:    { desc: 'The divine carrier — transforms ideas from potential into manifestation through sustained and dedicated action.', mantra: 'Om Apam Vatsaya Namah', quality: 'Manifestation, Carrying Ideas to Reality' },
  aryama:        { desc: 'The Noble Deity — patron of righteous marriage, sacred contracts, and mutually empowering support structures.', mantra: 'Om Aryamne Namah', quality: 'Marriage, Sacred Contracts, Noble Support' },
  savita:        { desc: 'The Divine Stimulator — ignites new projects, initiates fresh cycles, and provides the solar force of new beginnings.', mantra: 'Om Savitre Namah', quality: 'New Beginnings, Project Initiation, Solar Start' },
  savitra:       { desc: 'The Divine Radiator — spreads awareness, light, and righteous influence outward into the world and community.', mantra: 'Om Savitraya Namah', quality: 'Spreading Awareness, Influence, Radiance' },
  vivaswan:      { desc: 'The Expansive Sun deity — governs social reach, public growth, and the expansion of one\'s sphere of influence.', mantra: 'Om Vivasvate Namah', quality: 'Social Expansion, Public Growth, Community' },
  indra_inner:   { desc: 'Inner executive power — the internal Indra that manages inner affairs with decisive authority and clear judgment.', mantra: 'Om Indraya Namah', quality: 'Executive Power, Inner Authority, Decision-making' },
  jaya:          { desc: 'The Mastery deity — bestows the energy of skill mastery, craft excellence, and the achievement of technical perfection.', mantra: 'Om Jayaya Namah', quality: 'Skill Mastery, Craft Excellence, Achievement' },
  mitra:         { desc: 'The Universal Friend — governs peaceful diplomacy, cooperative relationships, and the art of harmonious co-existence.', mantra: 'Om Mitraya Namah', quality: 'Universal Friendship, Peace, Harmonious Relations' },
  rudra:         { desc: 'The Transformer — the healing-destroyer aspect of Shiva. Breaks old patterns and initiates profound purification.', mantra: 'Om Rudraya Namah', quality: 'Transformation, Pattern Breaking, Purification' },
  rajayakshma:   { desc: 'The Consumption deity — governs the enjoyment of royal pleasures, luxury experiences, and the refinement of taste.', mantra: 'Om Rajayakshmaya Namah', quality: 'Luxury, Refined Pleasures, Royal Enjoyment' },
  prithvi_dhara: { desc: 'The Foundation deity — governs structural stability, earth energy, and the solid grounding that supports all endeavors.', mantra: 'Om Prithvidharaya Namah', quality: 'Foundation, Structural Stability, Earth Energy' },
}

/* Navagraha — Vedic 9-planet directional zones ──────────────────── */
export const NAVAGRAHA_ZONES = [
  { planet: 'Su', name: 'Surya (Sun)',     dir: 'E',   en: 'East',       qual: 'Authority, health, social recognition, leadership', color: '#FF8C00', remedy: 'Copper Surya Yantra, Red flowers, Wheat offering', mantra: 'Om Hram Hrim Hraum Sah Suryaya Namah' },
  { planet: 'Mo', name: 'Chandra (Moon)',  dir: 'NW',  en: 'North-West', qual: 'Emotions, mind, relationships, fluidity, intuition', color: '#C0C0C0', remedy: 'Silver Moon Yantra, White flowers, Rice offering',  mantra: 'Om Shram Shrim Shraum Sah Chandraya Namah' },
  { planet: 'Ma', name: 'Mangala (Mars)',  dir: 'S',   en: 'South',      qual: 'Courage, property, brothers, energy, assertion',     color: '#DC143C', remedy: 'Copper Mangal Yantra, Red lentils, Triangular items', mantra: 'Om Kram Krim Kraum Sah Bhaum Namah' },
  { planet: 'Me', name: 'Budha (Mercury)', dir: 'N',   en: 'North',      qual: 'Business, communication, intellect, commerce',        color: '#228B22', remedy: 'Green Emerald, Copper Mercury Yantra, Green gram',   mantra: 'Om Bram Brim Braum Sah Budhaya Namah' },
  { planet: 'Ju', name: 'Guru (Jupiter)',  dir: 'NE',  en: 'North-East', qual: 'Wisdom, children, spiritual growth, expansion',       color: '#DAA520', remedy: 'Gold Jupiter Yantra, Yellow sapphire, Turmeric',     mantra: 'Om Gram Grim Graum Sah Guruve Namah' },
  { planet: 'Ve', name: 'Shukra (Venus)',   dir: 'SE',  en: 'South-East', qual: 'Wealth, beauty, luxury, relationships, arts',         color: '#FF69B4', remedy: 'Silver Venus Yantra, White flowers, Sugar offering',  mantra: 'Om Dram Drim Draum Sah Shukraya Namah' },
  { planet: 'Sa', name: 'Shani (Saturn)',   dir: 'W',   en: 'West',       qual: 'Discipline, longevity, service, karma, patience',     color: '#4169E1', remedy: 'Iron Shani Yantra, Blue sapphire, Sesame seeds',      mantra: 'Om Pram Prim Praum Sah Shanaye Namah' },
  { planet: 'Ra', name: 'Rahu',            dir: 'SW',  en: 'South-West', qual: 'Material ambition, foreign, technology, illusion',    color: '#800080', remedy: 'Lead Rahu Yantra, Coconut, Hassonite Garnet',         mantra: 'Om Bhram Bhrim Bhraum Sah Rahave Namah' },
  { planet: 'Ke', name: 'Ketu',            dir: 'NNE', en: 'North-NE',   qual: 'Spirituality, liberation, past karma, occult',        color: '#808080', remedy: 'Iron Ketu Yantra, Cat\'s Eye, Sesame & black items',   mantra: 'Om Sram Srim Sraum Sah Ketave Namah' },
]

/* Vastu Doshas — from Manasara, Mayamata, Vishwakarma Prakash ───── */
export const VASTU_DOSHAS = [
  {
    id: 'brahma-dosha', name: 'Brahma Sthana Dosha', severity: 'critical', zone: 'Center',
    desc: 'Central area obstructed by pillar, heavy beam, toilet, staircase, or wall. The most serious Vastu problem to fix.',
    effect: 'Confusion, poor decisions, chronic family disharmony, central nervous system issues, leadership failure.',
    remedy: 'Keep the central 1/9th area completely open. Place a Vastu Purush Yantra (copper) in the center. Install crystal sphere or Swastik symbol. Never drill marma points.',
    scripture: 'Manasara (Ch. 14): "The center of the site is sacred as the sky itself. Any construction here invites cosmic displeasure."',
    checkFn: () => true,
  },
  {
    id: 'ishan-dosha', name: 'Ishan (NE) Dosha', severity: 'high', zone: 'NE',
    desc: 'North-East corner is cut, lowered, has toilet, kitchen, heavy structure, or fire element.',
    effect: 'Loss of wisdom, mental disturbance, health deterioration, blocked spiritual growth, strained finances.',
    remedy: 'Keep NE clear and light. Place water body or fountain. Install copper Shri Yantra or clear quartz crystal. Perform daily water puja in NE.',
    scripture: 'Brihat Samhita (53.76): "Ishan belongs to Isha (Shiva). Difficult influence here causes suffering to the master of the house, his wisdom and health."',
    checkFn: () => true,
  },
  {
    id: 'agni-dosha', name: 'Agni (SE) Dosha', severity: 'medium', zone: 'SE',
    desc: 'South-East has water body, toilet, or the corner is missing/extended south.',
    effect: 'Cash flow trouble, digestive issues, fire safety concerns, money worries, low confidence.',
    remedy: 'Place triangular red items, fire lamp (Akhand Jyoti), copper pyramid in SE. Avoid water storage in SE completely.',
    scripture: 'Vishwakarma Prakash: "Agni in the SE is the sustainer of wealth. Water opposing fire here drains wealth."',
    checkFn: () => true,
  },
  {
    id: 'nairiti-dosha', name: 'Nairiti (SW) Dosha', severity: 'high', zone: 'SW',
    desc: 'South-West corner is open, low, has main entrance, missing, or has a water body.',
    effect: 'Instability, relationship breakdowns, skill decline, frequent relocation, loss of accumulated wealth.',
    remedy: 'Add height and weight to SW. Place heavy furniture or rock garden. Use yellow and brown colors. Plant a Banyan tree if space permits.',
    scripture: 'Manasara: "Nirriti rules the SW with the weight of the Earth. An open SW is like a ship without an anchor — all gains are lost."',
    checkFn: () => true,
  },
  {
    id: 'vayu-dosha', name: 'Vayu (NW) Dosha', severity: 'medium', zone: 'NW',
    desc: 'North-West is excessively open, lacks support, or has heavy construction creating NW extension.',
    effect: 'Lack of support from others, unstable relationships, erratic income, dependency and anxiety.',
    remedy: 'Balance NW with metallic wind chimes (7-rod). White/silver colors. Moderately open — not too heavy, not too empty.',
    scripture: 'Vastu Vidya Granth: "Vayu Kona governs all supportive relationships. Imbalance brings the wind of isolation and financial instability."',
    checkFn: () => true,
  },
  {
    id: 'veedhi-shoola', name: 'Veedhi Shoola (Road Hit)', severity: 'high', zone: 'Any wall',
    desc: 'A road or pathway directly hits/aims at any face or corner of the property.',
    effect: 'Mishaps, sudden losses, legal challenges, stress-related health issues, obstacles in career.',
    remedy: 'Install Vastu Kavach. Plant dense trees or bamboo as buffer. Place protective mirror (facing road). Install Hanuman Yantra on affected wall.',
    scripture: 'Mayamata (Ch. 6): "Roads converging at a point create Veedhi Shoola — they pierce the property like a spear, draining its vital force."',
    checkFn: () => true,
  },
  {
    id: 'underground-water', name: 'Underground Water Dosha', severity: 'medium', zone: 'SW, S, SE',
    desc: 'Underground water storage, boring well, or septic tank in the SW, S, or SE zones.',
    effect: 'Destabilization of earth energy, financial draining, health issues related to water-borne ailments.',
    remedy: 'Relocate water storage to NE, N, or E zones. Place Varun Yantra near water source. Perform Vastu Shanti puja.',
    scripture: 'Samarangana Sutradhara (Ch. 19): "Water flowing beneath the SW erodes the foundation of the household, both literal and metaphorical."',
    checkFn: () => true,
  },
  {
    id: 'staircase-dosha', name: 'Staircase Direction Dosha', severity: 'low', zone: 'NE, Center',
    desc: 'Main staircase located in the North-East or exact center of the property.',
    effect: 'Heavy energy in wisdom/health zone (NE) or sacred center causes mental restlessness and health issues.',
    remedy: 'Best staircase positions: S, SW, W, NW. Place Sri Yantra near NE staircase. Keep area well-lit.',
    scripture: 'Vastu Shastra: "The staircase of a house should always climb toward the South or West, never toward the sacred Ishan (NE) corner."',
    checkFn: () => true,
  },
]

/* 16 Marma Points — energy meridians that must not be pierced ───── */
export const MARMA_POINTS = [
  { id: 'm1',  name: 'Brahma Marma',    pos: 'Exact Center',            desc: 'Supreme — never drill, bore, or place heavy object here' },
  { id: 'm2',  name: 'Ishan Marma',     pos: 'NE corner junction',      desc: 'Head of Vastu Purusha — keep open and sacred' },
  { id: 'm3',  name: 'Indra Marma',     pos: 'North-center junction',   desc: 'Career energy channel — avoid heavy cutting' },
  { id: 'm4',  name: 'Surya Marma',     pos: 'East-center junction',    desc: 'Solar meridian — avoid shadow-casting objects' },
  { id: 'm5',  name: 'Agni Marma',      pos: 'SE corner junction',      desc: 'Fire energy node — no water bodies here' },
  { id: 'm6',  name: 'Yama Marma',      pos: 'South-center junction',   desc: 'Dharma channel — avoid main entrance' },
  { id: 'm7',  name: 'Nirriti Marma',   pos: 'SW corner junction',      desc: 'Earth anchor — never open or lower this corner' },
  { id: 'm8',  name: 'Varuna Marma',    pos: 'West-center junction',    desc: 'Water law node — avoid blocking' },
  { id: 'm9',  name: 'Vayu Marma',      pos: 'NW corner junction',      desc: 'Air node — balance, not too heavy/light' },
  { id: 'm10', name: 'Soma Marma',      pos: 'Mid-West wall inner',     desc: 'Moon nectar point — keep nourished and cool' },
  { id: 'm11', name: 'Bhallat Marma',   pos: 'Upper-West inner',        desc: 'Abundance node — do not obstruct' },
  { id: 'm12', name: 'Mukhya Marma',    pos: 'Central-West inner',      desc: 'Direction node — keep pathways clear' },
  { id: 'm13', name: 'Savita Marma',    pos: 'Mid-East inner',          desc: 'Initiation node — allow morning light' },
  { id: 'm14', name: 'Vivaswan Marma',  pos: 'Lower-East inner',        desc: 'Expansion node — no permanent furniture' },
  { id: 'm15', name: 'Mitra Marma',     pos: 'Central-South inner',     desc: 'Friendship node — keep warm and welcoming' },
  { id: 'm16', name: 'Prithvi Marma',   pos: 'Mid-North inner',         desc: 'Earth foundation node — structural care' },
]

/* Yantra Placement Guide (Tantric Vastu tradition) ──────────────── */
export const YANTRA_GUIDE = [
  { yantra: 'Vastu Purush Yantra',    zone: 'Center (Brahma Sthana)', mat: 'Copper', timing: 'Sunday Sunrise', purpose: 'Master remedy — balances all 45 deities, removes all Vastu doshas simultaneously' },
  { yantra: 'Shri Yantra (Sri Chakra)',zone: 'NE, Pooja Room',        mat: 'Gold or Copper', timing: 'Friday Sunrise', purpose: 'Supreme Lakshmi yantra — overall prosperity, cosmic beauty, divine grace' },
  { yantra: 'Kuber Yantra',           zone: 'North (N)',              mat: 'Gold or Brass', timing: 'Monday (Shukla Paksha)', purpose: 'Treasury activation, Kubera blessing, steady financial growth' },
  { yantra: 'Surya Yantra',           zone: 'East (E)',               mat: 'Copper', timing: 'Sunday Sunrise', purpose: 'Solar health, authority, recognition, leadership energy' },
  { yantra: 'Chandra Yantra',         zone: 'North-West (NW)',        mat: 'Silver', timing: 'Monday (Purnima)', purpose: 'Mind peace, emotional balance, relationship harmony' },
  { yantra: 'Mangal Yantra',          zone: 'South (S), SE',          mat: 'Copper (triangular)', timing: 'Tuesday', purpose: 'Property protection, courage, defeat of enemies, fire energy' },
  { yantra: 'Budha Yantra',           zone: 'North (N)',              mat: 'Gold or Brass', timing: 'Wednesday', purpose: 'Business success, communication, intellectual sharpness' },
  { yantra: 'Guru Yantra',            zone: 'NE, Study Room',         mat: 'Gold', timing: 'Thursday Sunrise', purpose: 'Wisdom, children\'s education, spiritual evolution, guru blessings' },
  { yantra: 'Shukra Yantra',          zone: 'SE, Bedroom',            mat: 'Silver', timing: 'Friday', purpose: 'Wealth attraction, beauty, luxury, relationship harmony' },
  { yantra: 'Shani Yantra',           zone: 'West (W), SW',           mat: 'Iron or Lead', timing: 'Saturday', purpose: 'Saturn pacification, longevity, discipline, removal of karma' },
  { yantra: 'Rahu Yantra',            zone: 'SW',                     mat: 'Lead', timing: 'Saturday Night', purpose: 'Rahu pacification, foreign success, technology, hidden gains' },
  { yantra: 'Ketu Yantra',            zone: 'NNE',                    mat: 'Iron', timing: 'Saturday', purpose: 'Ketu pacification, spiritual liberation, occult protection' },
]

/* Metal & Element Remedies by Direction ─────────────────────────── */
export const METAL_REMEDIES = [
  { dir: 'N',  element: 'Jal',    metal: 'Zinc / Silver',      bhuta: 'Jal (Water)',     color: '#3b82f6', items: 'Silver bowl, blue sapphire, water container, aquamarine crystal', avoid: 'Fire elements, red colors, sharp metal objects' },
  { dir: 'NE', element: 'Jal',    metal: 'Gold',               bhuta: 'Jal (Water)',     color: '#f59e0b', items: 'Gold coins, quartz crystal, Shri Yantra, clear water vessel', avoid: 'Toilet, heavy structures, kitchen, fire' },
  { dir: 'E',  element: 'Vayu',   metal: 'Copper',             bhuta: 'Vayu (Air)',      color: '#10b981', items: 'Copper pot, green plants, wooden items, sunlight mirror', avoid: 'Iron, heavy stone, dark colors' },
  { dir: 'SE', element: 'Agni',   metal: 'Copper / Bronze',    bhuta: 'Agni (Fire)',     color: '#ef4444', items: 'Brass pyramid, red triangle, fire lamp (Akhand Jyoti), camphor', avoid: 'Water, blue colors, underground storage' },
  { dir: 'S',  element: 'Agni',   metal: 'Brass / Bronze',     bhuta: 'Agni (Fire)',     color: '#dc2626', items: 'Brass items, yellow earthen pots, red/orange colors, Yama lamp', avoid: 'Main entrance (inauspicious), open space' },
  { dir: 'SW', element: 'Prithvi',metal: 'Lead / Iron',        bhuta: 'Prithvi (Earth)', color: '#d97706', items: 'Heavy stone slab, yellow crystals, iron stand, large earthen pots', avoid: 'Open corner, low structure, water body, main door' },
  { dir: 'W',  element: 'Akasha', metal: 'Iron / Steel',       bhuta: 'Akasha (Space)',  color: '#6b7280', items: 'Iron wind chime, metal sculpture, grey stones, lead pyramid', avoid: 'Nothing — balanced use of all metals OK' },
  { dir: 'NW', element: 'Vayu',   metal: 'Silver / White Metal', bhuta: 'Vayu (Air)',    color: '#94a3b8', items: '7-rod metal wind chime, white curtains, silver bowl, white flowers', avoid: 'Heavy stone, excessive construction, dark earth colors' },
]

/* Plant Vastu (Vastu Vriksha Shastra) ───────────────────────────── */
export const VASTU_PLANTS = [
  { plant: 'Tulsi (Ocimum sanctum)',  zone: 'N, NE, E',  benefit: 'Purifies 200m radius, divine Vishnu blessing, enhances Ishan wisdom energy', avoid: 'SW, S — diminishes earth element' },
  { plant: 'Banana (Kadali)',         zone: 'NE',         benefit: 'Jupiter (Guru) energy, auspiciousness, fertility, puja blessing', avoid: 'SE, S — reduces fire confidence' },
  { plant: 'Coconut (Shriphala)',      zone: 'N, NW',      benefit: 'Kubera tree of prosperity, auspiciousness, brings Lakshmi into home', avoid: 'SW center — blocks earth stability' },
  { plant: 'Neem (Azadirachta)',      zone: 'NW, W',      benefit: 'Purifies air, removes Vayu dosha, powerful antibacterial spiritual aura', avoid: 'NE, N — blocks water and wisdom energy' },
  { plant: 'Ashoka (Saraca asoca)',   zone: 'E, SE',      benefit: 'Sun energy, removes grief (a-shoka), auspicious for couples, solar power', avoid: 'NW, N — wrong element for water zones' },
  { plant: 'Bamboo (Lucky)',          zone: 'E, SE',      benefit: 'Rapid growth, strength, absorbs electromagnetic negativity', avoid: 'SW — creates instability in earth zone' },
  { plant: 'Mogra / Jasmine',         zone: 'N, W',       benefit: 'Moon energy, fragrance purifies subtle body, emotional wellbeing, devotion', avoid: 'SE — wrong for fire zone' },
  { plant: 'Money Plant (Pothos)',    zone: 'SE',         benefit: 'Venus (Shukra) energy, cash flow activation, financial abundance', avoid: 'NE — slows spiritual clarity and wisdom' },
  { plant: 'Lotus (Padma)',           zone: 'NE, N',      benefit: 'Supreme auspiciousness, Lakshmi seat, purity, spiritual elevation', avoid: 'SW, S — fire conflict' },
  { plant: 'Aloe Vera',              zone: 'N, NE',      benefit: 'Healing energy, purifies air, Jal element balance, health protection', avoid: 'SE, SW — reduces earth and fire quality' },
]

/* Sleeping Direction (Shayana Vidhi) — Charaka Samhita & Vastu ─── */
export const SLEEP_DIRECTIONS = [
  { head: 'South', quality: 'best',    icon: '⭐⭐⭐', col: '#10b981', desc: 'Recommended for all. Aligns body\'s bio-magnetic north with Earth\'s south pole (same polarity = repulsion = sound, restful sleep). Long life, health, prosperity and undisturbed sleep.' },
  { head: 'East',  quality: 'good',    icon: '⭐⭐',   col: '#f59e0b', desc: 'Excellent for students, scholars, and spiritual seekers. Solar energy enters from head, increasing intelligence, spiritual clarity, and fresh morning energy. Promotes learning.' },
  { head: 'West',  quality: 'average', icon: '⭐',    col: '#94a3b8', desc: 'Moderate direction. Promotes fame-seeking and social ambitions. May cause restlessness or vivid dreams. Used for those working in public life or arts.' },
  { head: 'North', quality: 'bad',     icon: '✗',    col: '#ef4444', desc: 'Strictly avoided in Vedic tradition. Earth\'s magnetic north pole creates opposing field to body\'s north, causing: disturbed sleep, poor memory, health issues, mental unrest, and chronic fatigue.' },
]

/* Panchabhutas and their Vastu zones, qualities, enhancement ────── */
export const PANCHA_BHUTAS = [
  { bhuta: 'Prithvi', name: 'Earth', zones: ['SW', 'S', 'W', 'SE'], qual: 'Stability, weight, patience, endurance, rootedness', color: '#d97706', enhance: 'Heavy stone, yellow/brown colors, low furniture, earthen pottery, lead/iron', icon: '⛰️' },
  { bhuta: 'Jal',     name: 'Water', zones: ['N', 'NE', 'NNE'],     qual: 'Flow, clarity, opportunities, purity, healing, creativity', color: '#3b82f6', enhance: 'Water fountain, aquarium, blue/silver colors, copper bowl with water, crystals', icon: '🌊' },
  { bhuta: 'Agni',    name: 'Fire',  zones: ['SE', 'SSE', 'E'],     qual: 'Energy, passion, transformation, digestion, confidence, cash', color: '#ef4444', enhance: 'Fire lamp, candles, red/orange colors, copper items, triangular shapes', icon: '🔥' },
  { bhuta: 'Vayu',    name: 'Air',   zones: ['NW', 'WNW', 'NNW', 'NE'], qual: 'Movement, speed, support, breath, communication, connections', color: '#10b981', enhance: 'Wind chimes, fans, light curtains, green plants, silver metal, open windows', icon: '🌬️' },
  { bhuta: 'Akasha',  name: 'Space', zones: ['W', 'WSW', 'Center'], qual: 'Expansion, consciousness, gains, sound, liberation, meditation', color: '#8b5cf6', enhance: 'Open space, crystals, sound bowls, grey/purple colors, no clutter, silence', icon: '✨' },
]

/* Prana Vayu — 5 life force currents mapped to zones ────────────── */
export const PRANA_VAYU_MAP = [
  { vayu: 'Prana Vayu',  dir: 'NE, NNE', func: 'Inward & upward force. Governs intake — breath, food, knowledge, perception. Life force entry point.', color: '#f59e0b' },
  { vayu: 'Apana Vayu',  dir: 'SE, ESE, WSW', func: 'Downward & outward force. Governs elimination, disposal, letting go. Exit of waste energy.', color: '#ef4444' },
  { vayu: 'Samana Vayu', dir: 'S, SSW, SW', func: 'Equalizing force. Governs digestion, assimilation, balance between intake and output.', color: '#d97706' },
  { vayu: 'Udana Vayu',  dir: 'N, WNW, NW', func: 'Upward force. Governs speech, expression, growth, ascent, evolution, and consciousness uplift.', color: '#3b82f6' },
  { vayu: 'Vyana Vayu',  dir: 'E, ENE, W', func: 'Pervasive force. Governs circulation, distribution, expansion throughout the entire space.', color: '#10b981' },
]

/* Ashta Dikpalas — 8 Directional Guardians ─────────────────────── */
export const DIKPALAS = [
  { dir: 'N',  deity: 'Kubera',   power: 'Wealth, Treasury',    weapon: 'Gada (mace)', mount: 'Man (human)', color: '#f59e0b', puja: 'Monday' },
  { dir: 'NE', deity: 'Ishana',   power: 'Wisdom, Divine Grace', weapon: 'Trishula',    mount: 'Bull (Nandi)', color: '#8b5cf6', puja: 'Monday' },
  { dir: 'E',  deity: 'Indra',   power: 'Rain, Sovereignty',    weapon: 'Vajra',      mount: 'Airavata (elephant)', color: '#DAA520', puja: 'Thursday' },
  { dir: 'SE', deity: 'Agni',    power: 'Fire, Transformation', weapon: 'Shakti',      mount: 'Ram (mesha)',  color: '#ef4444', puja: 'Tuesday' },
  { dir: 'S',  deity: 'Yama',    power: 'Dharma, endings',        weapon: 'Danda',      mount: 'Buffalo',     color: '#1f2937', puja: 'Saturday' },
  { dir: 'SW', deity: 'Nirriiti', power: 'Dissolution, Stability',weapon: 'Khadga',    mount: 'Corpse/Lion', color: '#7c3aed', puja: 'Saturday' },
  { dir: 'W',  deity: 'Varuna',  power: 'Water, Cosmic Law',    weapon: 'Pasha (lasso)',mount: 'Makara (crocodile)', color: '#3b82f6', puja: 'Friday' },
  { dir: 'NW', deity: 'Vayu',   power: 'Wind, Speed',          weapon: 'Dhvaja (flag)',mount: 'Deer (mriga)', color: '#10b981', puja: 'Wednesday' },
]

/* ─── Helpers ─────────────────────────────────────────────────────── */
export const ELEM_ICON: Record<string, string>  = { Jal: '🌊', Agni: '🔥', Vayu: '🌬️', Prithvi: '⛰️', Akasha: '✨', Water: '🌊', Fire: '🔥', Air: '🌬️', Earth: '⛰️', Space: '✨' }
export const ELEM_COLOR: Record<string, string> = { Jal: '#3b82f6', Agni: '#ef4444', Vayu: '#10b981', Prithvi: '#d97706', Akasha: '#8b5cf6', Water: '#3b82f6', Fire: '#ef4444', Air: '#10b981', Earth: '#d97706', Space: '#8b5cf6' }

/* ══════════════════════════════════════════════════════════════════
   ASTRO-VASTU SYNTHESIS DATA
   Source: Astro Vastu — Classical Vedic Synthesis
   Combining Vedic Jyotish (Kundali) with Vastu Shastra spatial science
   ══════════════════════════════════════════════════════════════════ */

/* 12 Bhavas (Houses) — Significance, Spatial Zone & Room Mapping ── */
export const BHAVA_MAP = [
  { h: 1,  name: 'Tanu Bhava',   eng: 'Self & Health',       dir: 'E',   room: 'Main Entrance / Façade',        icon: '🧍', color: '#f59e0b',
    signifies: 'Body, personality, overall health, head, self-image, initiative, vitality',
    spatial: 'The East wall and main entrance represent the Lagna — the face of the house. This zone governs how energy enters the property.',
    activate: 'Keep East entrance bright, clean and unobstructed. Plant sunflowers or tulsi near the main door.',
    lord_tip: 'If 1st lord is strong in its own/exaltation sign, the East zone energises naturally. Weak 1st lord → prioritise East wall remedies.',
    professions: ['Self-driven professions', 'Fitness & wellness', 'Medicine', 'Psychiatry', 'Politics'] },
  { h: 2,  name: 'Dhan Bhava',   eng: 'Family & Wealth',     dir: 'SE',  room: 'Kitchen / Treasury / Dining',    icon: '💰', color: '#ef4444',
    signifies: 'Family, accumulated wealth, speech, food habits, bank balance, face, neck, liquid assets',
    spatial: 'SE zone governs cash flow and family sustenance. Kitchen in SE channels Agni (fire energy) for financial metabolism.',
    activate: 'Maintain kitchen stove in SE. Keep financial documents and lockers in a clean, energised SE area.',
    lord_tip: '2nd lord in helpful houses (1,4,5,9,10,11) → good wealth flow. Malefic placement → remediate SE with Agni deepam and copper pyramids.',
    professions: ['Banking & Finance', 'Jewellery', 'Food industry', 'Wealth management', 'Family business'] },
  { h: 3,  name: 'Vikrama Bhava', eng: 'Efforts & Siblings',  dir: 'S',   room: 'Gym / Study / Hobby Room',      icon: '💪', color: '#dc2626',
    signifies: 'Efforts, younger siblings, neighbours, communication, courage, short travel, planning, arms, shoulders',
    spatial: 'South direction channels Mars energy — force, courage and willpower. Gym or activity spaces here multiply personal energy.',
    activate: 'Place exercise equipment in S or SSE. Motivational symbols, trophies. Keep S wall solid and supportive.',
    lord_tip: '3rd lord well-placed → self-made success. Poor placement → south zone needs Mars yantra and red coral energisation.',
    professions: ['Online business', 'Marketing & Sales', 'Media', 'Agency/Franchise', 'IT work', 'Tour & Travel'] },
  { h: 4,  name: 'Sukha Bhava',  eng: 'Home & Comfort',      dir: 'SW',  room: 'Master Bedroom / Living Room',  icon: '🏠', color: '#7c3aed',
    signifies: 'Mother, home, mental peace, emotions, luxuries (property & vehicles), domestic comfort, heart, education',
    spatial: 'SW is the most stable directional zone — earth element dominates. Master bedroom here ensures grounding and restful sleep for the family head.',
    activate: 'Master bedroom in SW with head facing South or East. Keep SW heavy (wardrobes, stone furniture). No bathroom or toilet in SW.',
    lord_tip: '4th lord strong → domestic happiness. Troubled 4th lord → SW needs Rahu/Ketu remedies plus blue sapphire energisation.',
    professions: ['Real estate & Vastu', 'Hospitality', 'Education', 'Work from home', 'Agriculture'] },
  { h: 5,  name: 'Putra Bhava',  eng: 'Creativity & Children', dir: 'W', room: "Children's Room / Entertainment", icon: '🎨', color: '#3b82f6',
    signifies: 'Education, children, love, creativity, intelligence, sports, stock market, solutions, healing',
    spatial: 'West zone (Saturn) gives results of effort. Children\'s rooms and creative spaces here harvest the fruits of intellectual labour.',
    activate: 'Children\'s bedroom in W or NW. Study desk facing East or North. Entertainment room in W. Avoid heavy storage here.',
    lord_tip: '5th lord exalted → exceptional creativity and children\'s success. Debilitated → W zone needs Jupiter yantra, yellow sapphire grid.',
    professions: ['Education & Teaching', 'Creative design', 'Stock market', 'Healing arts', 'Drama & Acting', 'Sports'] },
  { h: 6,  name: 'Rog Bhava',   eng: 'Health & Service',    dir: 'NW',  room: 'Bathroom / Utility / Staff Room', icon: '⚕️', color: '#10b981',
    signifies: 'Obstacles, diseases, enemies, debts, litigation, service, discipline, job, hard work',
    spatial: 'NW zone (Moon-Vayu) supports movement, service and helpful people. Utility areas here keep disease energy in its correct spatial quarter.',
    activate: 'Bathroom in NW or W. Servant quarters in NW. Keep this zone airy and well-ventilated. No main entrance in exact NW.',
    lord_tip: '6th lord in 1/6/11 → service success. In 4/7 → domestic or partnership disputes. Remediate NW with white metals and Vayu yantra.',
    professions: ['Doctors & Lawyers', 'Financial services', 'Government service', 'Healthcare', 'Military & Police'] },
  { h: 7,  name: 'Kalatra Bhava', eng: 'Partnership & Marriage', dir: 'N', room: 'Business Corner / Guest Room',  icon: '🤝', color: '#f59e0b',
    signifies: 'Spouse, business partners, daily interactions, customers, retail business, marital relations, business place',
    spatial: 'North zone (Mercury) governs new opportunities and partnerships. Guest room and business entrance in North activate relationship energy.',
    activate: 'Guest bedroom in NW or NE. Business cabin facing North. Keep North zone open, uncluttered and well-lit.',
    lord_tip: '7th lord strong → flourishing partnerships. Malefic 7th lord → N zone needs Mercury yantra, green aventurine grid.',
    professions: ['Retail business', 'Customer service', 'Partnerships', 'Consultancy', 'Trading'] },
  { h: 8,  name: 'Randhra Bhava', eng: 'Transformation & Research', dir: 'NNE', room: 'Safe / Underground Storage',  icon: '🔬', color: '#8b5cf6',
    signifies: 'Unknown aspects, longevity, transformation, in-laws, unearned money, research, occult, surgery, hidden forces',
    spatial: 'NNE zone governs Ketu\'s energy — hidden, transformative. Underground spaces, safes and research corners belong here.',
    activate: 'Keep NNE zone clean and sacred. Appropriate for meditation or a small mandir. Avoid heavy plumbing or waste here.',
    lord_tip: '8th lord in kendra (angular houses: 1, 4, 7, 10)/trikona (trine houses: 1, 5, 9) with helpful aspect → research success. Malefic → NNE needs Ketu puja and white crystal grid.',
    professions: ['Research & Analytics', 'Taxation', 'Engineering', 'Insurance', 'Astrology', 'Surgery', 'Technology'] },
  { h: 9,  name: 'Bhagya Bhava', eng: 'Fortune & Spirituality', dir: 'NE', room: 'Puja Room / Library / Guru Corner', icon: '🙏', color: '#DAA520',
    signifies: 'Luck, divine grace, father, guru, spirituality, religion, higher education, foreign travel, philosophical wisdom',
    spatial: 'NE is the supreme zone — Ishan corner, the abode of Shiva/Jupiter. Puja room here maximises divine blessings and fortune.',
    activate: 'Puja room must be in NE. Library or sacred books in NE/N. No kitchen, toilet or heavy storage in NE. Keep light and open.',
    lord_tip: '9th lord exalted (Jupiter in Cancer, Sun in Aries) → exceptional fortune. Troubled → NE must be deeply purified and energised.',
    professions: ['Teaching & Consultancy', 'Spiritual work', 'Immigration services', 'Religious institutions', 'Higher education'] },
  { h: 10, name: 'Karma Bhava',  eng: 'Career & Status',     dir: 'ENE', room: 'Home Office / Study / Professional Space', icon: '💼', color: '#f97316',
    signifies: 'Profession, social status, administration, politics, government, identity, authority, career ambitions',
    spatial: 'ENE zone (Sun-East) energises the professional drive. Home office or study facing this direction amplifies career success.',
    activate: 'Office desk facing ENE or N. Place professional awards, diplomas and career symbols here. Avoid clutter in professional space.',
    lord_tip: '10th lord in Lagna or Kendra (angular houses: 1, 4, 7, 10) → stellar career. Troubled → home office in ENE needs Sun yantra and Ruby energisation.',
    professions: ['All professions', 'Government jobs', 'Administration', 'Politics', 'Business leadership'] },
  { h: 11, name: 'Labha Bhava',  eng: 'Gains & Social Circle', dir: 'NNW', room: 'Garden / Outdoor Space / Social Area', icon: '🌟', color: '#22c55e',
    signifies: 'Profits, friends, big organisations, NGOs, wish fulfillment, elder siblings, social networks, victory',
    spatial: 'NNW zone (Mercury-Vayu) governs attraction and incoming desires. Outdoor entertaining areas here magnetise gains and friendships.',
    activate: 'Garden parties, outdoor seating in NNW. Wind chimes in NNW attract helpful contacts. Social/family events in this zone.',
    lord_tip: '11th lord strong → large gains with less effort. In 12th → gains from foreign sources. Activate NNW with Rahu yantra and silver.',
    professions: ['Big organisations', 'NGOs & Clubs', 'Community services', 'Network marketing', 'Cooperative societies'] },
  { h: 12, name: 'Vyaya Bhava',  eng: 'Isolation & Liberation', dir: 'WNW', room: 'Meditation Room / Guest Bedroom / Foreign',icon: '🧘', color: '#6366f1',
    signifies: 'Isolation, foreign settlement, spiritual liberation, expenditure, losses, meditation, charity, hospitals',
    spatial: 'WNW zone governs detachment and higher surrender. Meditation rooms and guest bedrooms for foreign visitors here support spiritual progress.',
    activate: 'Meditation corner in WNW or NW. Avoid using WNW as master bedroom. Good for a spare guest room or yoga/meditation space.',
    lord_tip: '12th lord in 12th own house or exalted → spiritual liberation and foreign gains. Troubled → WNW needs Moon yantra and pearl grid.',
    professions: ['Yoga & Meditation', 'Hospitality', 'Foreign business', 'MNCs', 'Charitable work', 'Ashrams & hospitals'] },
]

/* Planet Character Profiles — Astro Vastu Spatial Mapping ─────────── */
export const PLANET_PROFILES: Record<string, { vastuDir: string; element: string; color: string; core: string; health: string; strengths: string[]; weaknesses: string[]; spatial: string; remedy: string }> = {
  Su: { vastuDir: 'E / ENE', element: 'Fire (Agni)', color: '#f59e0b',
    core: 'Soul/Atma — willpower, authority, self-respect, innovation, truth, government',
    health: 'Heart, bones, right eye, spine',
    strengths: ['Leadership in east-facing careers', 'Strong personal identity', 'Government connections', 'Spiritual clarity'],
    weaknesses: ['Ego-driven decisions', 'Heart/bone vulnerabilities if under pressure', 'Conflict with authority figures'],
    spatial: 'Activate East zone for Sun-related life areas. Home office or study facing East amplifies solar energy. Red/orange accents in East wall.',
    remedy: 'Ruby (Manik), Copper Sun yantra in East, Surya Namaskar facing East at sunrise, Sunday fasting' },
  Mo: { vastuDir: 'NW', element: 'Water (Jal)', color: '#e2e8f0',
    core: 'Mind/Manas — emotions, mental stability, motherly nature, mood, intuition, hospitality',
    health: 'Left eye, mental disorders, depression, stomach, ovaries, breasts',
    strengths: ['Emotional intelligence', 'Strong intuition', 'Maternal nurturing energy', 'Hospitality business'],
    weaknesses: ['Mood swings', 'Excessive sentimentality', 'Sleep disorders if under pressure'],
    spatial: 'NW zone (Vayu-Moon) supports emotional comfort. Master bedroom should not be in NW (causes restlessness). Keep NW airy.',
    remedy: 'Pearl (Moti), Silver Moon yantra in NW, Monday puja with white flowers, Chandra mantra' },
  Ma: { vastuDir: 'S / SSE', element: 'Fire (Agni)', color: '#ef4444',
    core: 'Energy/Shakti — aggression, courage, fire, surgery, property, military, accidents',
    health: 'Blood, bones, injuries, hemoglobin, genitals, surgeries',
    strengths: ['Property acquisition', 'Physical courage', 'Engineering success', 'Sports achievement'],
    weaknesses: ['Aggressive conflict at home if in 4H', 'Accidents near South zone if under pressure', 'Impulsiveness'],
    spatial: 'South wall should be solid and load-bearing (Mars principle). No open spaces or cuts in South. Gym in S or SSE zone.',
    remedy: 'Red Coral (Moonga), Copper Mars yantra in SSE, Tuesday fast, Hanuman puja' },
  Me: { vastuDir: 'N / NNW', element: 'Air (Vayu)', color: '#22c55e',
    core: 'Intellect/Buddhi — intelligence, communication, business, networking, speech, Mercury rules trade',
    health: 'Nervous system, respiratory, spinal cord, depression, paralysis, deafness',
    strengths: ['Business acumen', 'Communication mastery', 'Financial intelligence', 'Technology aptitude'],
    weaknesses: ['Overthinking', 'Nervous system sensitivity', 'Indecisiveness if under pressure'],
    spatial: 'North zone (Mercury) governs opportunities and business. Home office or business cabin facing North or ENE maximises Mercury energy.',
    remedy: 'Emerald (Panna), Green Mercury yantra in N, Wednesday puja, Budha mantra chanting' },
  Ju: { vastuDir: 'NE / NNE', element: 'Water (Jal)', color: '#DAA520',
    core: 'Wisdom/Guru — expansion, growth, wisdom, prosperity, children, spirituality, divine grace',
    health: 'Liver, weight gain, cancer risk if under pressure, tumours, epilepsy',
    strengths: ['Divine wisdom', 'Teaching ability', 'Wealth expansion', 'Children\'s success'],
    weaknesses: ['Excessive optimism', 'Weight management challenges', 'Overindulgence if under pressure'],
    spatial: 'NE is Jupiter\'s supreme zone. Puja room must be here. Keep NE light, elevated and sacred. No heavy items or toilet in NE.',
    remedy: 'Yellow Sapphire (Pukhraj), Gold Jupiter yantra in NE, Thursday puja with yellow flowers, Brihaspati mantra' },
  Ve: { vastuDir: 'SE / ESE', element: 'Fire/Water', color: '#ec4899',
    core: 'Beauty/Shukra — love, marriage, wealth, vehicles, fashion, art, relationships, luxury',
    health: 'Throat, kidneys, tonsils, diabetes, skin problems',
    strengths: ['Creative arts mastery', 'Wealth accumulation', 'Relationship harmony', 'Luxury real estate'],
    weaknesses: ['Overindulgence', 'Kidney/diabetes risk if under pressure', 'Relationship complications'],
    spatial: 'SE zone (Venus-Agni) governs cash flow and confidence. Kitchen in SE is auspicious (Venus+Fire). Bedroom in SE for couples enhances romance.',
    remedy: 'Diamond (Heera) or White Sapphire, Silver Venus yantra in SE, Friday puja with white lotus, Shukra mantra' },
  Sa: { vastuDir: 'W / WSW', element: 'Air (Vayu)', color: '#94a3b8',
    core: 'Karma/Shani — discipline, delay, karma, responsibility, longevity, labourers, old age',
    health: 'Chronic illnesses, gallbladder, blockages, phobias, nervous conditions',
    strengths: ['Long-term discipline', 'Real estate gains', 'Research depth', 'Karmic leadership'],
    weaknesses: ['Delays and obstacles if weak', 'Chronic health issues', 'Depression tendencies'],
    spatial: 'West zone (Saturn) gives results of sustained effort. Heavy storage and utility rooms in West. No entrance in exact West (causes delays).',
    remedy: 'Blue Sapphire (Neelam) or Amethyst, Iron Saturn yantra in W, Saturday oil lamp at Shani temple, Shani mantra' },
  Ra: { vastuDir: 'SW', element: 'Earth (Prithvi)', color: '#7c3aed',
    core: 'Illusion/Maya — worldly desires, foreign elements, technology, ambition, secrecy, innovation',
    health: 'Multiplies diseases of associated planets, skin issues, neurological conditions',
    strengths: ['Technology success', 'Foreign connections', 'Material ambitions', 'Photography/Media'],
    weaknesses: ['Deception and illusion', 'Addictive tendencies', 'Instability if uncontrolled'],
    spatial: 'SW zone (Rahu-Earth) must be kept heavy and grounded. Main entrance never in SW. Master bedroom here for house owner is acceptable.',
    remedy: 'Hessonite Garnet (Gomed), Lead Rahu yantra in SW, Saturday or Rahu Kalam puja, Rahu mantra' },
  Ke: { vastuDir: 'NNE', element: 'Fire/Ether', color: '#a78bfa',
    core: 'Liberation/Moksha — detachment, spiritual liberation, research, past lives, isolation, healing',
    health: 'Mental health, isolation, mystical diseases, neurological conditions',
    strengths: ['Spiritual advancement', 'Research depth', 'Hidden knowledge', 'Traditional medicine'],
    weaknesses: ['Social detachment', 'Mental health sensitivity', 'Confusion about material goals'],
    spatial: 'NNE zone (Ketu) is sacred and mystical. Meditation room or underground safe in NNE. Keep spiritually clean — no waste or clutter.',
    remedy: 'Cat\'s Eye (Lahsuniya), Iron Ketu yantra in NNE, spiritual puja on Saturdays, Ketu mantra' },
}

/* 12-House Lord Placement Quick-Read Matrix ─────────────────────── */
export const LORD_PLACEMENT_KEY = [
  { houses: [1, 5, 9], label: 'Trikona (Dharma Triangles)', quality: 'excellent', desc: 'Lord in these houses gives divine grace, purpose and natural luck. The corresponding Vastu zone flourishes without much effort.' },
  { houses: [4, 7, 10], label: 'Kendra (Pillar Houses)', quality: 'strong', desc: 'Lord in Kendra (angular houses: 1, 4, 7, 10) houses gives strong material results. The Vastu zone provides solid, stable support for the life area.' },
  { houses: [2, 11], label: 'Upachaya (Growth Houses)', quality: 'good', desc: 'Lord in 2nd or 11th gives increasing wealth and gains over time. The Vastu zone improves with age if kept clean.' },
  { houses: [3, 6], label: 'Dusthana (Challenge Houses)', quality: 'weak', desc: 'Lord in 3rd or 6th creates struggle and effort needed. The Vastu zone may leak energy — prioritise cleaning and activating.' },
  { houses: [8, 12], label: 'Dusthana (Loss/Hidden Houses)', quality: 'afflicted', desc: 'Lord in 8th or 12th hides or dissolves the life-area energy. The corresponding Vastu zone needs strong remediation and purification.' },
]

/* Rashi (Zodiac Sign) Quick Reference — Vedic Astro Vastu ─────────── */
export const RASHI_PROFILES: Record<number, { symbol: string; element: string; lord: string; quality: string; vastuColor: string; advice: string }> = {
  1:  { symbol: '♈', element: 'Fire',  lord: 'Ma', quality: 'Energetic, pioneering, assertive, courageous', vastuColor: '#ef4444', advice: 'Red energisation in S/SSE zone activates your Lagna energy' },
  2:  { symbol: '♉', element: 'Earth', lord: 'Ve', quality: 'Reliable, patient, practical, affectionate', vastuColor: '#ec4899', advice: 'Venus remedies in SE zone enhance financial stability' },
  3:  { symbol: '♊', element: 'Air',   lord: 'Me', quality: 'Curious, adaptable, communicative, witty', vastuColor: '#22c55e', advice: 'Mercury activation in N zone boosts communication and business' },
  4:  { symbol: '♋', element: 'Water', lord: 'Mo', quality: 'Emotional, nurturing, intuitive, protective', vastuColor: '#e2e8f0', advice: 'Moon remedies in NW zone enhance domestic peace and intuition' },
  5:  { symbol: '♌', element: 'Fire',  lord: 'Su', quality: 'Confident, ambitious, generous, charismatic', vastuColor: '#f59e0b', advice: 'Sun activation in E/ENE zone amplifies authority and career' },
  6:  { symbol: '♍', element: 'Earth', lord: 'Me', quality: 'Analytical, meticulous, reliable, practical', vastuColor: '#22c55e', advice: 'Mercury in N zone + WSW zone for service-based income growth' },
  7:  { symbol: '♎', element: 'Air',   lord: 'Ve', quality: 'Diplomatic, charming, fair-minded, sociable', vastuColor: '#ec4899', advice: 'Venus activation in SE + N zone partnership harmony' },
  8:  { symbol: '♏', element: 'Water', lord: 'Ma', quality: 'Intense, resourceful, determined, passionate', vastuColor: '#ef4444', advice: 'Mars remedies in S + NNE zone for research and transformation' },
  9:  { symbol: '♐', element: 'Fire',  lord: 'Ju', quality: 'Optimistic, adventurous, independent, philosophical', vastuColor: '#DAA520', advice: 'Jupiter activation in NE zone maximises fortune and wisdom' },
  10: { symbol: '♑', element: 'Earth', lord: 'Sa', quality: 'Disciplined, responsible, ambitious, practical', vastuColor: '#94a3b8', advice: 'Saturn remedies in W/WSW zone for disciplined career growth' },
  11: { symbol: '♒', element: 'Air',   lord: 'Sa', quality: 'Innovative, humanitarian, independent, intellectual', vastuColor: '#94a3b8', advice: 'Saturn + Mercury combination activates gains in W and N zones' },
  12: { symbol: '♓', element: 'Water', lord: 'Ju', quality: 'Compassionate, artistic, intuitive, gentle', vastuColor: '#DAA520', advice: 'Jupiter remedies in NE + WNW zone for spiritual liberation and foreign gains' },
}

/* Dig Bala rows — directional strength copy (planet id stays English) */
export const DIG_BALA = [
  { planet: 'Ju', dir: 'East (Lagna)', desc: 'Max strength in 1st bhava — wisdom, expansion, children' },
  { planet: 'Su', dir: 'South (10H)',  desc: 'Max strength in 10th bhava — career, authority, father' },
  { planet: 'Sa', dir: 'West (7H)',    desc: 'Max strength in 7th bhava — longevity, discipline, service' },
  { planet: 'Mo', dir: 'North (4H)',   desc: 'Max strength in 4th bhava — mind, mother, domestic peace' },
  { planet: 'Ma', dir: 'South (10H)',  desc: 'Directional strength adds courage and property gains' },
  { planet: 'Me', dir: 'North (1H)',   desc: 'Commerce and communication amplified in North-facing rooms' },
]

export const ROOM_GUIDE = [
  { room: 'Pooja / Meditation', icon: '🙏', best: 'NE', element: 'Jal', desc: 'Ishan corner — Ishana Shiva. Greatest spiritual energy. Never store clutter.' },
  { room: 'Kitchen', icon: '🍳', best: 'SE', element: 'Agni', desc: 'Agni corner — fire and transformation. Alternate: NW if SE unavailable.' },
  { room: 'Master Bedroom', icon: '🛌', best: 'SW', element: 'Prithvi', desc: 'SW gives stability, relationship security, restful sleep. Head → South.' },
  { room: 'Living Room', icon: '🛋️', best: 'E, NE', element: 'Vayu', desc: 'Solar morning light, social connectivity, welcoming guests.' },
  { room: 'Study / Office', icon: '📚', best: 'W, N', element: 'Akasha', desc: 'West gives gains from knowledge; North activates Kubera-Mercury energy.' },
  { room: 'Children\'s Room', icon: '🧒', best: 'W, NW', element: 'Akasha', desc: 'West supports education (Saturn); NW gives peer support.' },
  { room: 'Dining', icon: '🍽️', best: 'W, NW', element: 'Akasha', desc: 'Gains and nourishment axis. Face East while eating for solar energy.' },
  { room: 'Toilet / Bathroom', icon: '🚿', best: 'NW, SSW', element: 'Prithvi', desc: 'Disposal zone. Never in NE, SE, or SW. Vayu NW best for elimination.' },
  { room: 'Storage / Utility', icon: '📦', best: 'SSW, WNW', element: 'Prithvi', desc: 'Disposal and inertia zones. Ideal for non-essential storage.' },
  { room: 'Staircase', icon: '🪜', best: 'S, SW, W', element: 'Prithvi', desc: 'Always ascend toward South or West. Never in NE or center.' },
]

export const ZONE_COLORS = [
  { zone: 'N',  color: '#3182ce', name: 'Blue',   planet: 'Me' },
  { zone: 'NE', color: '#F0FFF4', name: 'White',  planet: 'Ju' },
  { zone: 'E',  color: '#38a169', name: 'Green',  planet: 'Su' },
  { zone: 'SE', color: '#e53e3e', name: 'Red',    planet: 'Ve' },
  { zone: 'S',  color: '#c05621', name: 'Orange', planet: 'Ma' },
  { zone: 'SW', color: '#ecc94b', name: 'Yellow', planet: 'Ra' },
  { zone: 'W',  color: '#4a5568', name: 'Grey',   planet: 'Sa' },
  { zone: 'NW', color: '#cbd5e0', name: 'Silver', planet: 'Mo' },
]

export const LIFE_AREAS = [
  { icon: '💼', area: 'Career', h: '10', zone: 'ENE', room: 'Home Office', planet: 'Su', color: '#f59e0b' },
  { icon: '💰', area: 'Wealth', h: '2', zone: 'SE', room: 'Kitchen', planet: 'Ve', color: '#ec4899' },
  { icon: '🙏', area: 'Fortune', h: '9', zone: 'NE', room: 'Puja Room', planet: 'Ju', color: '#DAA520' },
  { icon: '💍', area: 'Marriage', h: '7', zone: 'N', room: 'Guest Room', planet: 'Me', color: '#22c55e' },
  { icon: '🏠', area: 'Home Peace', h: '4', zone: 'SW', room: 'Master Bed', planet: 'Ra', color: '#7c3aed' },
  { icon: '👶', area: 'Children', h: '5', zone: 'W', room: "Kids' Room", planet: 'Sa', color: '#94a3b8' },
  { icon: '⚕️', area: 'Health', h: '6', zone: 'NW', room: 'Utility', planet: 'Mo', color: '#e2e8f0' },
  { icon: '📈', area: 'Gains', h: '11', zone: 'NNW', room: 'Garden/Social', planet: 'Me', color: '#22c55e' },
  { icon: '💪', area: 'Courage', h: '3', zone: 'S', room: 'Gym', planet: 'Ma', color: '#ef4444' },
  { icon: '🔬', area: 'Research', h: '8', zone: 'NNE', room: 'Safe/Store', planet: 'Ke', color: '#a78bfa' },
  { icon: '🧘', area: 'Spiritual', h: '12', zone: 'WNW', room: 'Meditation', planet: 'Ju', color: '#6366f1' },
  { icon: '🧍', area: 'Self', h: '1', zone: 'E', room: 'Main Entry', planet: 'Su', color: '#f59e0b' },
]

export const PLANET_COMPASS = [
  { dir: 'NW', label: 'Moon', sym: '🌙', theme: 'Banking · Emotions', color: '#e2e8f0', h: '6' },
  { dir: 'N', label: 'Mercury', sym: '☿', theme: 'Career · Business', color: '#22c55e', h: '7' },
  { dir: 'NE', label: 'Jupiter', sym: '♃', theme: 'Fortune · Blessings', color: '#DAA520', h: '9' },
  { dir: 'W', label: 'Saturn', sym: '♄', theme: 'Gains · Discipline', color: '#94a3b8', h: '5' },
  { dir: 'C', label: 'Brahma', sym: '☸', theme: 'Centre · Balance', color: '#DAA520', h: '' },
  { dir: 'E', label: 'Sun', sym: '☀', theme: 'Self · Authority', color: '#f59e0b', h: '1' },
  { dir: 'SW', label: 'Rahu', sym: '☊', theme: 'Stability · Desire', color: '#7c3aed', h: '4' },
  { dir: 'S', label: 'Mars', sym: '♂', theme: 'Courage · Energy', color: '#ef4444', h: '3' },
  { dir: 'SE', label: 'Venus', sym: '♀', theme: 'Wealth · Cash Flow', color: '#ec4899', h: '2' },
]

export const VASTU_OBJECTS = [
  { obj: 'Water Fountain', zone: 'N, NE', icon: '⛲' },
  { obj: 'Plants / Wood', zone: 'E', icon: '🌿' },
  { obj: 'Fire Lamp', zone: 'SE', icon: '🕯️' },
  { obj: 'Heavy Stone', zone: 'SW', icon: '🪨' },
  { obj: 'Iron Chime', zone: 'W, NW', icon: '🔔' },
  { obj: 'Crystals', zone: 'Center', icon: '💎' },
  { obj: 'Sea Salt Bowl', zone: 'SSW', icon: '🧂' },
  { obj: 'Copper Pyramid', zone: 'SE', icon: '🔺' },
]

export const FACING = {
  East: { label: 'East-Facing', why: 'Solar energy amplifies your ascendant, bringing vitality, social recognition, and leadership.', mantra: 'Surya-facing home aligned with solar Lagna' },
  South: { label: 'South-Facing', why: 'Mars energy grounds your ascendant, providing strength, stability, and material accumulation.', mantra: 'Yama-facing home — fame and authority' },
  West: { label: 'West-Facing', why: 'Saturn energy disciplines your ascendant, supporting longevity, gains, and structured growth.', mantra: 'Varuna-facing home — profits and results' },
  North: { label: 'North-Facing', why: 'Mercury energy activates your ascendant, supporting business, communication, and opportunities.', mantra: 'Kubera-facing home — wealth and opportunity' },
}
