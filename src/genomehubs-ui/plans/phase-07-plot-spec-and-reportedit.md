# Phase 7: Plot-Spec Adoption and Report Editor Rewrite

## Objective

Adopt reusable plot specifications and replace the brittle report editor with a schema-driven implementation.

## Deliverables

- Dual report URL model support:
  - inline spec form for ad hoc exploration
  - `specId` form for shared/published reports
- Legacy query URL -> plot spec translation.
- New report editor using schema validation and explicit apply/reset flows.

## Work items

1. Implement plot-spec translation utilities and canonicalization.
2. Add router handling for inline spec and `specId` modes.
3. Replace existing report editor with modular schema-driven editor.
4. Migrate report tools/download/code panes to the new editor contract.

## Testing gates

- Roundtrip equivalence tests:
  - legacy URL -> spec -> canonical URL
  - inline spec -> rendered report
  - specId -> resolved spec -> rendered report
- reportEdit resilience tests for rapid edits, route changes, and invalid input.
- Backward compatibility tests for existing shared links.

## Exit criteria

- New editor is default under flag in staging and passes resilience suite.
- Legacy editor path is deprecated with rollback option retained.
