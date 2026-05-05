# Phase 6: Full Report Migration Foundation and Renderer Parity

## Objective

Prepare all report families for SDK-backed execution with stable view-model mapping and lifecycle control.

## Deliverables

- Shared report query/spec normalization layer.
- Report mapper layer translating API/SDK responses to renderer-ready models.
- Stable progress/cancel/retry lifecycle integrated into report orchestration.

## Work items

1. Extract report parameter normalization from brittle ad hoc branching.
2. Build per-report-family mappers with common interfaces.
3. Align report orchestration with SDK lifecycle semantics.
4. Ensure embedded markdown report paths use the same report pipeline.

## Testing gates

- Golden dataset tests for each report family:
  - histogram
  - scatter
  - tree
  - map
  - table
  - arc/ribbon
- Visual regression snapshots for each family.
- Embedded markdown report smoke tests across all critical pages.

## Exit criteria

- All report families pass parity checks in SDK mode before any production cutover.
