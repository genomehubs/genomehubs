# Phase 0: Testing and Quality Infrastructure Baseline

## Objective

Establish the minimum testing and quality rails required to execute refactor phases safely.

## Deliverables

- Working UI test command (replace placeholder failure script).
- Unit test harness for UI modules (parsers, builders, adapters).
- Integration test harness for store + async flows.
- Storybook interaction and visual regression baseline.
- Basic migration CI checks for lint, unit, and selected integration suites.

## Work items

1. Configure test runner and test environment.
2. Add deterministic mocks for navigation, URL APIs, and fetch transport.
3. Add first-pass coverage targets for critical modules.
4. Define snapshot strategy for report visual outputs.
5. Add smoke tests for markdown pages containing embedded reports.

## Testing gates

- `test` command executes in CI and local environments.
- At least one passing test in each category:
  - unit
  - integration
  - visual/snapshot
  - markdown embed smoke
- Baseline failure triage process defined.

## Exit criteria

- Phase 1 cannot start until Phase 0 gates pass.
