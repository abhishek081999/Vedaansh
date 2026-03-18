# Jyotish Platform

A Next.js + TypeScript astrology platform focused on Vedic chart calculations, ephemeris-based planetary positions, panchang elements, and Vimshottari dasha timelines.

## Tech Stack

- Next.js 14
- TypeScript
- Vitest
- MongoDB (Mongoose)
- Upstash Redis (optional cache)
- Swiss Ephemeris (`sweph`)

## Project Structure

- `src/app/api/chart/calculate/route.ts`: Main chart calculation API endpoint
- `src/app/api/atlas/search/route.ts`: Location search API endpoint
- `src/lib/engine/ephemeris.ts`: Core ephemeris and astronomy helpers
- `src/lib/engine/nakshatra.ts`: Nakshatra, tithi, yoga, karana, vara calculations
- `src/lib/engine/dasha/vimshottari.ts`: Vimshottari dasha generation
- `src/lib/engine/calculator.ts`: High-level chart calculation orchestrator
- `src/lib/db/mongodb.ts`: MongoDB connection singleton
- `__tests__/engine/core.test.ts`: Engine unit tests

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas (or compatible MongoDB instance)

## Environment Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in at least these values:
- `MONGODB_URI` (required)
- `MONGODB_DB_NAME` (optional, defaults to `jyotish`)
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (optional, enables cache)
- `EPHE_PATH` (optional, defaults to `./ephe`)

Important:
- Never commit `.env` or `.env.local`.
- Keep only placeholder values in `.env.example`.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

## Quality Checks

```bash
npm run test:engine
npm run typecheck
npm run lint
npm run build
```

## Product Plan

The detailed platform plan is maintained in:

- [Vedic_Platform_JS_Full_Plan.docx](Vedic_Platform_JS_Full_Plan.docx)

Use that document for product scope, feature tiers, and rollout details.

## MongoDB Connectivity Check

A helper script is included to verify your MongoDB credentials:

```bash
node scripts/check-mongo.cjs
```

Expected output on success:

- `MongoDB connection OK`
- Database name and host

## API Endpoints

### POST /api/chart/calculate

Calculates a chart from birth details.

Example payload:

```json
{
  "name": "Sample Person",
  "birthDate": "1990-01-01",
  "birthTime": "12:30:00",
  "birthPlace": "Mumbai",
  "latitude": 19.076,
  "longitude": 72.8777,
  "timezone": "Asia/Kolkata",
  "settings": {
    "ayanamsha": "lahiri",
    "houseSystem": "whole_sign",
    "nodeMode": "mean",
    "karakaScheme": 8,
    "gulikaMode": "phaladipika",
    "chartStyle": "south",
    "showDegrees": true,
    "showNakshatra": false,
    "showKaraka": false,
    "showRetro": true
  }
}
```

### GET /api/atlas/search?q=...

Searches locations from local atlas database.

## Notes

- Engine tests currently validate known reference values around J2000 and dasha sequencing logic.
- Redis cache is optional; when missing, chart calculation still works without cache.

## License

Private project. Add your preferred license before open-source release.
