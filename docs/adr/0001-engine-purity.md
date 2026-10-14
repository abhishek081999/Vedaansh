# ADR 0001 — Pure astrology engine

**Status:** accepted  
**Date:** 2024–2026 (standing invariant)

## Context

Jyotish calculations (Swiss Ephemeris via `sweph`) are CPU-heavy, must be deterministic, and must remain testable without a running app stack. Mixing React, MongoDB, Redis, or NextAuth into calculation modules would couple math to infrastructure and break Vitest on some platforms.

## Decision

Keep `src/lib/engine/**` as **pure functions**: inputs → `ChartOutput` (and related types). Orchestrator: `calculateChart()` in `calculator.ts`. Sidereal longitudes via `getAyanamsha` + `toSidereal`. Domain types live in `src/types/astrology.ts`.

API routes own auth, plan gates, caching, and persistence. UI never imports engine modules that pull I/O.

## Consequences

- Engine tests stay fast and portable (`__tests__/engine/**` must not import redis/mongoose/next-auth).
- Plan filtering (e.g. vargas) can run at the API boundary after calculation.
- Native `sweph` forces **Node** runtime (not Edge) for chart APIs.
- Contributors must not add React/DB/Redis imports under `src/lib/engine/**`.
