# Why Chara Dasha showed only 2 levels for past and future {#chara-depth}

Chara (and Mandook/Sthir) only built level-3 Pratyantar under the **current** branch. Previous and future periods stopped at Antar (level 2). The builders now expand every branch to depth 3.

- `buildSubDashas` gated children on `isCurrent`, so non-current antars got empty `children`.
- `DashaTree` uses `lazyExpand={false}` for sign dashas, so it cannot fill missing levels on click.
- Hydrate reused cached Chara trees, so an old prune would stick until recalculate; it now always recomputes.

@answer scope="Chara · Chara FE · Mandook · Sthir · depth 3"
@meta locale=en

## What you saw in the UI {#symptom}

| Period | Before | After |
| --- | --- | --- |
| Current Maha → Antar → Pratyantar | 3 levels {good:OK} | 3 levels {good:OK} |
| Previous / future Maha → Antar | 2 levels {bad:Stuck} | 3 levels {good:Fixed} |
| Click to expand past/future Pratyantar | No children {bad:Dead end} | 12 Pratyantars {good:Expandable} |

## Where the prune lived {#cause}

@workflow id=chara-build title="Chara tree build"
| lane calc | Calculator |
| lane ui | DashaTree |
| maha | Build 12 Mahas | backend | calc |
| antar | Always add Antars | backend | calc |
| gate | isCurrent? | backend | calc |
| deep | Add Pratyantars | backend | calc |
| empty | children = [] | external | calc |
| tree | Render with lazyExpand false | frontend | ui |
| maha > antar | |
| antar > gate | |
| gate > deep | yes | emphasis |
| gate > empty | no |
| deep > tree | |
| empty > tree | |

@steps id=chara-build-steps
| maha | Build 12 Mahas | Each sign period at level 1. | chara-build | maha |
| antar | Always add Antars | Level 2 for every Maha. | chara-build | antar |
| gate | isCurrent? | Old code only continued for the running period. | chara-build | gate |
| deep | Add Pratyantars | Level 3 now for every Antar when depth is 3. | chara-build | deep |

## What changed {#fix}

In `src/lib/engine/dasha/chara.ts` (and the same gate in `jaimini.ts`):

```diff
- children: (level < maxDepth && isCurrent)
+ children: level < maxDepth
```

`hydrateChara.ts` always recomputes so cached charts pick this up without a full recalculate.

## Check it {#verify}

- [ ] Open Jaimini → Chara Dasha, click a **past** Maha, then an Antar — you should see 12 Pratyantars.
- [ ] Click a **future** Maha the same way — also depth 3.
- [ ] Current path still highlights and reaches Pratyantar.
- [ ] Mandook / Sthir modes behave the same.
