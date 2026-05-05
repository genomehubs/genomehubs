# Phase 3: URL Compatibility, Query Sync Replacement, and Abort Safety

## Objective

Introduce legacy URL compatibility and remove timing/side-effect risks before broader URL and SDK migration.

## Deliverables

- `legacyUrlCompat` layer:
  - parse legacy URL forms
  - produce canonical representation
  - redirect safely
- Replacement for `querySync` with deterministic state synchronization.
- Per-request abort management replacing global mutable cancel state.

## Work items

1. Implement URL compatibility parser and redirect policy.
2. Replace fragile URL<->state sync with testable hook/service.
3. Refactor request cancellation to per-request controller ownership.
4. Integrate with feature flags and observability hooks.

## Testing gates

- URL roundtrip tests:
  - legacy URL -> canonical URL -> stable replay
- Sync timing tests for route changes and rapid navigation.
- Cancellation tests ensure one request cancel does not cascade to unrelated requests.

## Exit criteria

- Legacy URL redirects are stable in test and staging.
- No global cancel-all behavior remains in migrated flows.
