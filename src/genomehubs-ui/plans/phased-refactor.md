# GenomeHubs UI Phased Refactor Plan

This plan defines a numbered migration from the current UI architecture to an SDK-backed, plot-spec-capable implementation.

## Scope and constraints

- Two search paths must remain covered throughout migration:
  - chip-based path
  - plain free-text search path
- Legacy UI URLs must continue to work via compatibility parsing and redirects to canonical URLs.
- Embedded markdown reports are critical and must be fully functional before SDK report go-live.
- Download/export API paths are currently stable and out of scope for SDK migration.
- Current `src/genomehubs-api` in this repository is deprecated as migration target.
- Future API/SDK source of truth is `cli-generator` outputs (including `crates/genomehubs-api` and JS templates).

## Numbered phases

- Phase 0: Testing and quality infrastructure baseline
- Phase 1: Baseline inventory and migration controls
- Phase 2: Dual search-path normalization and parity
- Phase 3: URL compatibility, query sync replacement, and request cancellation safety
- Phase 4: URL composition consolidation and conversion ledger completion
- Phase 5: SDK transport cutover by domain
- Phase 6: Full report migration foundation and renderer parity
- Phase 7: Plot-spec adoption and report editor rewrite
- Phase 8: RTK Query modernization and legacy retirement

## Phase checklist and roadmap

| Phase | Goal | Est. Duration | Dependencies | Owner | Status |
|-------|------|----------------|--------------|-------|--------|
| **Phase 0** | Testing infrastructure baseline | 1-2 weeks | None | TBD | Not started |
| **Phase 1** | Baseline inventory and controls | 1 week | Phase 0 | TBD | Not started |
| **Phase 2** | Search path parity | 2-3 weeks | Phase 1 | TBD | Not started |
| **Phase 3** | URL compat, querySync, abort safety | 2-3 weeks | Phases 1, 2 | TBD | Not started |
| **Phase 4** | URL consolidation ledger | 2-3 weeks | Phase 3 | TBD | Not started |
| **Phase 5** | SDK transport cutover | 3-4 weeks | Phases 3, 4 | TBD | Not started |
| **Phase 6** | Report migration foundation | 3-4 weeks | Phase 5 | TBD | Not started |
| **Phase 7** | Plot-spec & reportEdit rewrite | 3-4 weeks | Phase 6 | TBD | Not started |
| **Phase 8** | RTK Query modernization | 2-3 weeks | Phase 7 | TBD | Not started |

**Total estimated duration: 20-28 weeks (~5-7 months) for full completion.**

## Detailed phase files

- `phase-00-testing-infrastructure.md`
- `phase-01-baseline-and-controls.md`
- `phase-02-search-path-parity.md`
- `phase-03-url-compat-querysync-abort.md`
- `phase-04-url-consolidation-ledger.md`
- `phase-05-sdk-transport-cutover.md`
- `phase-06-report-migration-foundation.md`
- `phase-07-plot-spec-and-reportedit.md`
- `phase-08-rtkquery-modernization.md`

## Release model

- Ship phases behind feature flags and progressive rollout controls.
- Keep rollback paths for search, report transport, and editor changes.
- Require phase-specific verification gates before advancing.
