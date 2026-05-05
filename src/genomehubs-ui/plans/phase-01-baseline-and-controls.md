# Phase 1: Baseline Inventory and Migration Controls

## Objective

Freeze a complete inventory of migration targets and establish rollout/rollback controls.

## Deliverables

- File-level inventory of URL composition/parsing, data transport, and report entry points.
- Search path parity matrix for chip and free-text flows.
- Migration ledger format and ownership.
- Feature flag map for staged cutover.

## Work items

1. Enumerate all URL composition points and classify each as:
   - migrate to builder
   - retain as route-only
   - deprecate
2. Enumerate all direct fetch/data access call sites.
3. Document both search-path execution flows and shared parity fixtures.
4. Define per-phase rollout flags and rollback paths.

## Testing gates

- Inventory diff checks catch newly introduced unmanaged URL/data call sites.
- Parity fixture set created and runnable in CI.
- Feature flag defaults validated in build variants.

## Exit criteria

- Migration ledger is complete and signed off.
- Flag plan exists for Phases 2-7.
