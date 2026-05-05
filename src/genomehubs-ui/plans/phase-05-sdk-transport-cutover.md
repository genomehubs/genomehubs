# Phase 5: SDK Transport Cutover by Domain

## Objective

Replace direct transport/fetch logic with SDK-backed adapters while preserving state and UI behavior.

## Deliverables

- SDK adapters for domain operations:
  - search/msearch
  - record/lookup/types
  - descendants/taxonomy
  - report progress support dependencies
- Feature-flagged path selection (legacy vs SDK).
- Telemetry for path usage and parity validation.

## Work items

1. Introduce adapter modules with stable request/response contracts.
2. Rewire selectors/services to call adapters instead of direct fetch.
3. Keep Redux state shape stable to minimize UI churn.
4. Add compatibility fallbacks for known edge cases.

## Testing gates

- Contract tests for each adapter against expected payload shapes.
- Dual-run parity checks (legacy and SDK) for representative fixture traffic.
- Error and retry path tests for network and API failure conditions.

## Exit criteria

- Targeted domains default to SDK path in staging with parity confirmed.
