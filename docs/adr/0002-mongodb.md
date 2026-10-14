# ADR 0002 — MongoDB Atlas + Mongoose

**Status:** accepted  
**Date:** standing

## Context

The product stores users, charts (with large optional calculated blobs), CRM clients, subscriptions, billing config, and admin audit trails. Document-shaped birth data and nested notes/remedies fit a flexible document store better than a rigid relational schema for early/mid product velocity.

## Decision

Use **MongoDB Atlas** with **Mongoose** (`src/lib/db/`). Split lean `Chart` documents from heavy `ChartCache` blobs. Use Redis only for ephemeral cache and rate limits — not source of truth.

NextAuth MongoDB adapter for session/account storage alongside the custom `User` model.

## Consequences

- Indexes and ownership queries (`userId`) are critical for multi-tenant safety.
- Schema evolution is flexible but requires care with Mixed fields (`settings`, `data`).
- Atlas networking (IP allowlist, SRV DNS) is an ops dependency — see RUNBOOK / `.env.example`.
- ChartOutput can be large; TTL on ChartCache + Redis gzip queue mitigate storage/RAM pressure.
