# Phase 8: RTK Query Modernization and Legacy Retirement

## Objective

Migrate data orchestration to RTK Query incrementally and retire legacy transport/state debt after stability milestones.

## Deliverables

- RTK Query slices introduced by domain order:
  - low-risk config/types
  - search domain
  - report domain
- Coexistence adapters for HOC-connected components during transition.
- Retirement plan for legacy thunks and direct-fetch pathways.

## Work items

1. Add RTK Query foundation and middleware integration.
2. Migrate domains in bounded slices with parity checks.
3. Replace legacy call paths after two stable cycles.
4. Remove deprecated modules and tighten lint guards.

## Testing gates

- Domain-by-domain parity and performance benchmarks.
- Cache behavior and invalidation tests.
- Long-run regression suite proving no behavior drift on key workflows.

## Exit criteria

- Legacy direct-fetch/thunk transport paths retired from targeted domains.
- RTK Query is default architecture for new work.
