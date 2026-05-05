# Phase 4: URL Composition Consolidation and Ledger Completion

## Objective

Route all URL composition/parsing through centralized builders and complete conversion tracking.

## Deliverables

- Central builders/parsers for:
  - API URLs
  - internal navigation URLs
  - report/search canonical URLs
- Conversion of ad hoc URL interpolation call sites.
- Fully updated migration ledger with status per call site.

## Work items

1. Build URL utilities with explicit typed inputs.
2. Migrate selectors to centralized URL builders.
3. Migrate components and helpers to centralized URL builders.
4. Preserve markdown/content URL fallback behavior with explicit ownership.
5. Mark each inventoried URL call site as migrated/retained/deprecated.

## Testing gates

- Static checks/lints detect forbidden ad hoc URL composition patterns.
- URL builder unit tests cover edge cases and encoding rules.
- Integration tests verify navigation parity for search/report/record.

## Exit criteria

- Ledger coverage reaches 100% for inventoried URL sites.
- No unmanaged URL composition remains in targeted modules.
