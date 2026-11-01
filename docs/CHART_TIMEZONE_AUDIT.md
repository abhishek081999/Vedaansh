# Chart timezone audit

Birth locations once got timezones from rough India and Nepal bounding boxes, so some saved charts may hold the wrong zone, which shifts the lagna. `scripts/audit-chart-timezones.ts` counts them. It only reads and changes nothing.

## Run

`.env.local` may point at production, so the script prints its target and stops unless you pass `--confirm`.

```bash
npx tsx scripts/audit-chart-timezones.ts
```

```bash
npx tsx scripts/audit-chart-timezones.ts --confirm > chart-timezone-audit.txt
```

The output holds chart ids, zones and counts, with no names or birth data. Don't commit it, and delete it after the review, because ids and zones still relate to real users. `.gitignore` doesn't cover this filename.

## What counts as a mismatch

The script works out the birth moment in the stored zone and in the zone for the chart's coordinates. It flags the chart only if the two moments differ, so `Asia/Calcutta` and `Asia/Kolkata` are not flagged, and neither are zones that agreed on that date, such as Lahore and Kolkata before 1951.

## Review

A mismatch is a question, not proof of an error.

- **Likely the old bug:** the stored zone is `Asia/Kolkata`, `Asia/Kathmandu` or `UTC`, and the expected zone is a neighbour such as `Asia/Dhaka`, `Asia/Karachi`, `Asia/Kabul` or `Asia/Yangon`. Lucknow-area coordinates stored as `Asia/Kathmandu` are the same case.
- **Possibly deliberate:** the form lets users pick a zone by hand. They may have done so for a record that uses a different standard time, or for a place whose saved coordinates are approximate. A zone far from the coordinates, unrelated to the old bounding boxes, is more likely a choice than the bug. So is an edited chart: the audit can't tell who set the zone, so check `updatedAt` against `createdAt` on a sample.
- **Coordinates may be the error:** an expected zone of `Etc/GMT*` means the coordinates are at sea, often `0, 0` or a typo. Charts near a border can also resolve to the neighbouring zone. Look at the coordinates before trusting the expected zone.
- **Shift size shows the impact:** the lagna moves about 1° every 4 minutes, so a 15-minute shift is roughly 4°, enough to change the lagna near a sign boundary and many varga positions.
- **Not comparable:** these charts have unusable coordinates, birth date or time, or stored zone. The calculate route treats a zone it can't read as UTC, so review them separately.

Open a sample from the largest groups as an admin before deciding. Don't rewrite zones in bulk from this report: a changed zone changes the user's chart, so users with deliberate choices should keep them. Notifying affected users and letting them confirm is the safer default.

## Limits

The audit covers the `charts` collection only. `Client` and `KundaliMilan` documents also store timezones and aren't checked.
