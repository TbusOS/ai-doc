# docs/superpowers/

This directory stores design specs and implementation plans for non-trivial initiatives in this repo — the stuff that wouldn't be obvious from the paper index alone.

## Directory layout

- `specs/` — Design documents. What we're building and why. Read first to understand intent.
- `plans/` — Step-by-step implementation plans. Written for a Claude subagent (or a developer with zero prior context) to execute.

## Current entries

| Topic | Spec | Plan | Status |
|---|---|---|---|
| 水墨风论文漫画系列 | [2026-04-21-paper-comic-design.md](specs/2026-04-21-paper-comic-design.md) | [2026-04-21-paper-comic-pilot.md](plans/2026-04-21-paper-comic-pilot.md) | 设计完成，执行等 64GB Mac |

## Convention

- Filenames: `YYYY-MM-DD-<topic>-<spec|plan|...>.md`
- Specs are bilingual where it helps; plans are in whatever language the executor (usually a Claude subagent) is most precise in.
- When an initiative ships, move the entry to a "Shipped" section below rather than deleting it — the decision trail is useful reading for whoever picks up the next one.

## Shipped

(none yet)
