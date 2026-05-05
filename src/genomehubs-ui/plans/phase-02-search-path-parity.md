# Phase 2: Dual Search-Path Normalization and Parity

## Objective

Unify query behavior across chip and free-text paths through shared adapters while preserving current UX.

## Deliverables

- Shared QueryAdapter contract for parse/validate/normalize/serialize.
- Removal of duplicate behavior drift points (wrapping, delimiters, fallback handling).
- Feature-flagged adapter wiring for both search paths.

## Work items

1. Build adapter interfaces for:
   - query parse/format
   - validation
   - fallback policy
2. Integrate chip path to shared adapter.
3. Integrate plain search path to shared adapter.
4. Keep current UI controls and component composition unchanged where possible.

## Testing gates

- Parity fixtures pass for both search paths:
  - same intent -> same normalized query
  - same validation decision
  - same canonical URL intent
- Batch search delimiters produce identical split behavior across paths.
- Regression tests for taxon wrapping and no-result fallback behavior.

## Exit criteria

- No known path-specific divergence in query normalization/validation.
