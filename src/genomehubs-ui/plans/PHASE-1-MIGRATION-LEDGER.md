# Phase 1: Migration Ledger & Feature Flag Map

**Status**: Phase 1 - Baseline & Controls  
**Purpose**: Track migration status and define staged rollout controls  
**Last Updated**: May 2026

---

## Overview

This document serves as the **authoritative record** of what gets migrated, when, and with what feature flags. It enables phased rollout, easy rollback, and clear ownership.

---

# Section 1: Migration Ledger

## Ledger Format

Each migration item has:

- **ID**: Unique identifier (PHASEx-ITEM-Y)
- **Component/File**: What's being migrated
- **Type**: URL builder / Query parser / Data fetch / Report system / etc.
- **Status**: Not Started / In Progress / Tested / Deployed / Deprecated
- **Owner**: Who owns the work
- **Target Phase**: Which phase it's scheduled for
- **Feature Flag**: Flag name that controls rollout
- **Rollback Plan**: How to roll back if needed
- **Test Coverage**: Link to test cases

---

## A. URL Composition Migrations

### PHASE2-URL-001: Search Query Builder

| Property             | Value                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Component**        | `search.js:30-130` buildSearchUrl()                                                  |
| **Type**             | URL builder → adapter pattern                                                        |
| **Current State**    | Direct `fetch()` call with string concatenation                                      |
| **Target State**     | Centralized `queryBuilder.search()` adapter                                          |
| **Owner**            | TBD                                                                                  |
| **Target Phase**     | Phase 2                                                                              |
| **Feature Flag**     | `USE_SDK_SEARCH_BUILDER`                                                             |
| **Rollback Plan**    | Keep old buildSearchUrl() alongside new adapter; toggle via feature flag             |
| **Test Coverage**    | `src/client/views/functions/__tests__/url.integration.test.js` (search URL patterns) |
| **Dependencies**     | None (standalone)                                                                    |
| **Complexity**       | Low                                                                                  |
| **Estimated Effort** | 2-3 days                                                                             |
| **Status**           | ⏳ Not Started                                                                       |

**Implementation Notes**:

- Create `src/client/views/adapters/queryBuilder.js`
- Export: `search(queryString) → URL`
- Maintain backward compatibility during Phase 2

---

### PHASE2-URL-002: Report Query Builder

| Property             | Value                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| **Component**        | `report.js:161-250` buildReportUrl()                                    |
| **Type**             | URL builder → adapter pattern                                           |
| **Current State**    | Direct fetch with reportId caching                                      |
| **Target State**     | Centralized `queryBuilder.report()` adapter                             |
| **Owner**            | TBD                                                                     |
| **Target Phase**     | Phase 2                                                                 |
| **Feature Flag**     | `USE_SDK_REPORT_BUILDER`                                                |
| **Rollback Plan**    | Keep legacy buildReportUrl() in parallel; feature flag toggles          |
| **Test Coverage**    | `src/client/views/selectors/__tests__/report.integration.test.js` (TBD) |
| **Dependencies**     | sortReportQuery() documentation (Phase 1)                               |
| **Complexity**       | Medium (depends on report type validation)                              |
| **Estimated Effort** | 3-4 days                                                                |
| **Status**           | ⏳ Not Started                                                          |
| **Blocker**          | sortReportQuery() rules must be fully documented first                  |

**Implementation Notes**:

- Lock down all 35+ validation rules in sortReportQuery() during Phase 1
- Create adapter that calls sortReportQuery() then builds URL
- Test with all report types (tree, histogram, map, scatter, arc)

---

### PHASE2-URL-003: Consolidate Record URL Builder

| Property             | Value                                                            |
| -------------------- | ---------------------------------------------------------------- |
| **Component**        | `record.js:31-90` buildRecordUrl()                               |
| **Type**             | Manual concatenation → builder adapter                           |
| **Current State**    | Multiple manual string concatenations                            |
| **Target State**     | Single `recordBuilder.build()` function                          |
| **Owner**            | TBD                                                              |
| **Target Phase**     | Phase 2                                                          |
| **Feature Flag**     | `USE_SDK_RECORD_BUILDER`                                         |
| **Rollback Plan**    | Keep old pattern; new pattern runs in parallel during transition |
| **Test Coverage**    | Phase 0 URL tests + new record-specific tests                    |
| **Dependencies**     | None                                                             |
| **Complexity**       | Low                                                              |
| **Estimated Effort** | 1-2 days                                                         |
| **Status**           | ⏳ Not Started                                                   |

---

### PHASE2-URL-004: Types/Taxonomy URL Builder

| Property             | Value                                                             |
| -------------------- | ----------------------------------------------------------------- |
| **Component**        | `types.js:492-530` and `types.js:1-50`                            |
| **Type**             | Manual concatenation → builder adapter                            |
| **Current State**    | Manual string concatenations for `/resultFields` and `/taxonomy`  |
| **Target State**     | Single `typeSystemBuilder.build()` function                       |
| **Owner**            | TBD                                                               |
| **Target Phase**     | Phase 2                                                           |
| **Feature Flag**     | `USE_SDK_TYPE_BUILDER`                                            |
| **Rollback Plan**    | Dual implementation with feature flag control                     |
| **Test Coverage**    | New: `src/client/views/selectors/__tests__/types-builder.test.js` |
| **Dependencies**     | None                                                              |
| **Complexity**       | Low                                                               |
| **Estimated Effort** | 1-2 days                                                          |
| **Status**           | ⏳ Not Started                                                    |

---

### PHASE2-URL-005: Chip-to-Query String Adapter

| Property             | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| **Component**        | `ChipSearch.jsx:200-300` chipToString()                               |
| **Type**             | String generator → bidirectional adapter                              |
| **Current State**    | Manual chip-to-string conversion                                      |
| **Target State**     | Centralized `chipAdapter` with reverse parser                         |
| **Owner**            | TBD                                                                   |
| **Target Phase**     | Phase 2                                                               |
| **Feature Flag**     | `USE_SDK_CHIP_ADAPTER`                                                |
| **Rollback Plan**    | Keep chipToString() as legacy; new adapter wraps it during transition |
| **Test Coverage**    | Phase 1 search parity tests + bidirectional roundtrip tests           |
| **Dependencies**     | Search parity matrix completion (Phase 1)                             |
| **Complexity**       | Medium                                                                |
| **Estimated Effort** | 2-3 days                                                              |
| **Status**           | ⏳ Not Started                                                        |
| **Blocker**          | Search parity matrix must identify all edge cases first               |

---

### PHASE2-URL-006: Consolidate Additional Selector URL Builders

| Property             | Value                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| **Component**        | Multiple selectors (8 additional files)                                                               |
| **Files**            | phylopic.js, descendants.js, checkProgress.js, file.js, analysis.js, explore.js, tree.js, taxonomy.js |
| **Type**             | Manual concatenations → apiBuilder adapter                                                            |
| **Current State**    | 8+ selectors with manual URL string concatenation                                                     |
| **Target State**     | Single `apiBuilder` adapter with typed endpoints                                                      |
| **Owner**            | TBD                                                                                                   |
| **Target Phase**     | Phase 2-3                                                                                             |
| **Feature Flag**     | `USE_SDK_API_BUILDER`                                                                                 |
| **Rollback Plan**    | Dual implementation; feature flag toggles between old and new                                         |
| **Test Coverage**    | New integration tests for each endpoint                                                               |
| **Dependencies**     | None                                                                                                  |
| **Complexity**       | Medium (8 distinct patterns)                                                                          |
| **Estimated Effort** | 4-5 days                                                                                              |
| **Status**           | ⏳ Not Started                                                                                        |

**Implementation Notes**:

- Create `src/client/views/adapters/apiBuilder.js`
- Consolidate endpoints: `/phylopic`, `/search` (variants), `/progress`, `/summary`, `/taxonomies`, `/indices`, `/report`
- Each endpoint gets typed function: `apiBuilder.phylopic()`, `apiBuilder.progress()`, etc.

---

### PHASE3-URL-007: Hash Deprecation (Critical: Backward Compatibility)

| Property             | Value                                                               |
| -------------------- | ------------------------------------------------------------------- |
| **Component**        | `location.js:216-240` toggleHash(), removeHash()                    |
| **Type**             | Hash reduction → query-param-only URLs                              |
| **Current State**    | URLs have BOTH hash (`#term`) AND query (`?query=term`) - redundant |
| **Target State**     | URLs use ONLY query params; hash fully removed                      |
| **Owner**            | TBD                                                                 |
| **Target Phase**     | Phase 3 (redirects), Phase 4 (cleanup), Phase 5 (full removal)      |
| **Feature Flag**     | `USE_QUERY_ONLY_URLS`                                               |
| **Rollback Plan**    | Feature flag can revert to hash support if needed                   |
| **Test Coverage**    | URL roundtrip tests; backward compatibility tests for old URLs      |
| **Dependencies**     | Phase 1: Map all current hash usage patterns                        |
| **Complexity**       | High (backward compatibility critical)                              |
| **Estimated Effort** | 3-4 days (Phase 3) + 2 days (Phase 4 cleanup)                       |
| **Status**           | 🔮 Planning                                                         |

**Detailed Phases**:

**Phase 3 Action**:

- Add redirect middleware: detect `#` in URL → normalize to query-param-only URL
- Enable users with old bookmarks to seamlessly transition
- Keep all hash handling code (as fallback)

**Phase 4 Action**:

- Migrate internal URL generation to ONLY use query params
- Stop calling `history.push()` with hash
- Make `toggleHash()` and `removeHash()` no-ops

**Phase 5 Action**:

- Remove hash handling code entirely
- Save ~200 bytes of URL space per search

**Why This Matters**:

- Current: `/search?query=Homo#Homo` (redundant 5 extra chars)
- Future: `/search?query=Homo` (cleaner, shorter URL)
- User benefit: Shorter bookmarkable URLs, less confusion about # vs ?

**Backward Compatibility**:

- SearchPage.jsx:158 already has fallback: `setLookupTerm(options.query || hashTerm)`
- Old URLs with hash still work during Phase 1-4
- Automatic redirect in Phase 3 → cleans up old bookmarks

---

## B. Query String Parsing (PHASE 3+)

### PHASE3-PARSER-001: Centralized Query Parser

| Property          | Value                                     |
| ----------------- | ----------------------------------------- |
| **Component**     | `qs.js:1-150` parse/stringify             |
| **Type**          | Already centralized (no migration)        |
| **Current State** | Well-tested, RFC 3986 compliant           |
| **Target State**  | RETAIN (wrap with error handling Phase 1) |
| **Owner**         | N/A                                       |
| **Target Phase**  | Retain through Phase 8                    |
| **Feature Flag**  | None needed                               |
| **Status**        | ✅ Retained                               |
| **Test Coverage** | `qs.test.js` (9 tests, all passing)       |

**Note**: This is a **retention item**. No migration needed.

---

## C. Data Fetch Sites (PHASE 1 Wrapping)

### PHASE1-FETCH-001: Wrap Search Fetch

| Property             | Value                                                        |
| -------------------- | ------------------------------------------------------------ |
| **Component**        | `search.js:70-130` fetch(buildSearchUrl())                   |
| **Type**             | Add error handling wrapper                                   |
| **Current State**    | Bare fetch() with basic error dispatch                       |
| **Target State**     | Fetch wrapped with centralized error handler                 |
| **Owner**            | TBD                                                          |
| **Target Phase**     | Phase 1 (wrapping only)                                      |
| **Feature Flag**     | `CENTRALIZED_ERROR_HANDLING`                                 |
| **Rollback Plan**    | Feature flag toggles between old and new error handler       |
| **Test Coverage**    | New: error handling tests for network failure, timeout, etc. |
| **Dependencies**     | None                                                         |
| **Complexity**       | Low                                                          |
| **Estimated Effort** | 1 day                                                        |
| **Status**           | ⏳ Not Started                                               |

**Implementation Notes**:

- Create `src/client/views/utils/fetchWrapper.js`
- Wrap all fetch calls with error handling
- Maintain existing error dispatch pattern for backward compatibility

---

### PHASE1-FETCH-002: Wrap Report Fetch

| Property          | Value                                                              |
| ----------------- | ------------------------------------------------------------------ |
| **Component**     | `report.js:161-250` fetch for reports                              |
| **Type**          | Add error handling wrapper                                         |
| **Current State** | Report fetch with basic error handling                             |
| **Target State**  | Centralized fetch wrapper with retry logic                         |
| **Owner**         | TBD                                                                |
| **Target Phase**  | Phase 1                                                            |
| **Feature Flag**  | `CENTRALIZED_ERROR_HANDLING`                                       |
| **Rollback Plan** | Feature flag toggle                                                |
| **Test Coverage** | Error scenarios: network failure, malformed report params, timeout |
| **Status**        | ⏳ Not Started                                                     |

---

## D. Report System (PHASE 1 Documentation, PHASE 6 Migration)

### PHASE1-REPORT-001: Document sortReportQuery() Validation Rules

| Property             | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| **Component**        | `report.js:34-160` sortReportQuery()                           |
| **Type**             | Documentation (not code change)                                |
| **Current State**    | Validation logic embedded in function, 35+ rules unclear       |
| **Target State**     | External validation schema + documented rules                  |
| **Owner**            | TBD                                                            |
| **Target Phase**     | Phase 1 (CRITICAL BLOCKER)                                     |
| **Deliverable**      | `PHASE-1-REPORT-VALIDATION-RULES.md` with all 35+ rules listed |
| **Test Coverage**    | Create test cases for each rule                                |
| **Complexity**       | Low (documentation only)                                       |
| **Estimated Effort** | 2-3 days                                                       |
| **Status**           | ⏳ Not Started                                                 |
| **Impact**           | **BLOCKS** Phase 2 URL builder work for reports                |

**Implementation Notes**:

- List all 35+ parameter validation rules by report type
- Create validation matrix: Report Type vs Allowed Parameters
- Add test cases for edge cases (invalid combinations, etc.)

---

### PHASE6-REPORT-002: Migrate Report Rendering to SDK

| Property          | Value                                                     |
| ----------------- | --------------------------------------------------------- |
| **Component**     | `Report.jsx` + report visualization system                |
| **Type**          | Component migration to SDK                                |
| **Current State** | Embedded reports with custom styling                      |
| **Target State**  | SDK-provided report components                            |
| **Owner**         | TBD                                                       |
| **Target Phase**  | Phase 6                                                   |
| **Feature Flag**  | `USE_SDK_REPORT_COMPONENTS`                               |
| **Rollback Plan** | Run both old and new in parallel; toggle via feature flag |
| **Status**        | 🔮 Planning                                               |
| **Dependency**    | SDK contracts must be finalized (cli-generator)           |

---

---

# Section 2: Feature Flag Map

## Rollout Timeline

```
Phase 0 (Now)
├─ Infrastructure ready
└─ No feature flags needed

Phase 1
├─ Error handling wrappers
│  └─ CENTRALIZED_ERROR_HANDLING
└─ Documentation (no flags needed)

Phase 2
├─ URL builders
│  ├─ USE_SDK_SEARCH_BUILDER
│  ├─ USE_SDK_REPORT_BUILDER
│  ├─ USE_SDK_RECORD_BUILDER
│  ├─ USE_SDK_TYPE_BUILDER
│  └─ USE_SDK_CHIP_ADAPTER
└─ Query parsing (no new flags, retained)

Phase 3
├─ URL compatibility layer
│  └─ USE_SDK_URL_COMPAT
└─ Legacy URL normalization

Phase 4-5
├─ Full query migration
└─ SDK transport integration

Phase 6
├─ Report system migration
│  └─ USE_SDK_REPORT_COMPONENTS
└─ Plot spec migration

Phase 7
├─ RTK Query modernization
│  └─ USE_RTKQUERY_CACHE
└─ Error boundary upgrades
```

---

## Feature Flag Reference

### CENTRALIZED_ERROR_HANDLING

```javascript
// Flag definition
CENTRALIZED_ERROR_HANDLING =
  process.env.REACT_APP_CENTRALIZED_ERROR_HANDLING || false;
```

**Purpose**: Control fetch error handling wrapper rollout

**Default**: `false` (old behavior)

**Deployment Timeline**:

- Phase 1: Test in dev environment
- Phase 1 → 2: Gradually enable in staging
- Phase 2: Full production rollout

**Rollback**: Set to `false` to revert to old error handling

---

### USE_SDK_SEARCH_BUILDER

```javascript
// Flag definition
USE_SDK_SEARCH_BUILDER = process.env.REACT_APP_USE_SDK_SEARCH_BUILDER || false;
```

**Purpose**: Control search URL builder migration

**Default**: `false` (use existing buildSearchUrl)

**Deployment Timeline**:

- Phase 2a: Internal testing with SDK builders
- Phase 2b: Canary deployment (5% of users)
- Phase 2c: Full rollout

**Rollback**: Set to `false` to revert to original buildSearchUrl()

**Verification**:

- URL identity test: new builder produces identical URLs as old builder
- Search results identical
- Performance no regression

---

### USE_SDK_REPORT_BUILDER

```javascript
// Flag definition
USE_SDK_REPORT_BUILDER = process.env.REACT_APP_USE_SDK_REPORT_BUILDER || false;
```

**Purpose**: Control report URL builder migration

**Default**: `false` (use existing buildReportUrl)

**Deployment Timeline**:

- Phase 2: Internal testing with SDK builders
- Phase 2-3: Canary + staged rollout
- Phase 3: Full rollout

**Rollback**: Set to `false`

**Verification**:

- All 35+ report validation rules still work
- Report results identical
- Report performance no regression

---

### USE_SDK_RECORD_BUILDER

```javascript
USE_SDK_RECORD_BUILDER = process.env.REACT_APP_USE_SDK_RECORD_BUILDER || false;
```

**Purpose**: Control record URL builder migration

**Default**: `false`

**Deployment Timeline**: Phase 2-3

**Rollback**: Set to `false`

---

### USE_SDK_TYPE_BUILDER

```javascript
USE_SDK_TYPE_BUILDER = process.env.REACT_APP_USE_SDK_TYPE_BUILDER || false;
```

**Purpose**: Control types/taxonomy URL builder migration

**Default**: `false`

**Deployment Timeline**: Phase 2-3

**Rollback**: Set to `false`

---

### USE_SDK_CHIP_ADAPTER

```javascript
USE_SDK_CHIP_ADAPTER = process.env.REACT_APP_USE_SDK_CHIP_ADAPTER || false;
```

**Purpose**: Control chip-to-query string adapter migration

**Default**: `false`

**Deployment Timeline**: Phase 2 (after search parity validated)

**Rollback**: Set to `false`

**Verification**:

- Parity tests: chip-based searches produce identical URLs
- Bidirectional conversion works (chip → string → chip)
- User experience identical

---

### USE_SDK_URL_COMPAT

```javascript
USE_SDK_URL_COMPAT = process.env.REACT_APP_USE_SDK_URL_COMPAT || false;
```

**Purpose**: Control URL compatibility layer (legacy → canonical URL mapping)

**Default**: `false`

**Deployment Timeline**: Phase 3

**Rollback**: Set to `false` (old URL formats continue working)

---

### USE_SDK_REPORT_COMPONENTS

```javascript
USE_SDK_REPORT_COMPONENTS =
  process.env.REACT_APP_USE_SDK_REPORT_COMPONENTS || false;
```

**Purpose**: Control report component migration to SDK

**Default**: `false` (use existing Report.jsx components)

**Deployment Timeline**: Phase 6

**Rollback**: Set to `false`

**Verification**:

- Report rendering identical
- All 5 report types (tree, histogram, map, scatter, arc) work
- Performance no regression
- Embedded markdown reports still work

---

### USE_RTKQUERY_CACHE

```javascript
USE_RTKQUERY_CACHE = process.env.REACT_APP_USE_RTKQUERY_CACHE || false;
```

**Purpose**: Control RTK Query cache migration

**Default**: `false`

**Deployment Timeline**: Phase 8

**Rollback**: Set to `false`

---

## Feature Flag Deployment Strategy

### Per-Environment Defaults

```javascript
// .env.development
REACT_APP_CENTRALIZED_ERROR_HANDLING = true;
REACT_APP_USE_SDK_SEARCH_BUILDER = false;

// .env.staging
REACT_APP_CENTRALIZED_ERROR_HANDLING = true;
REACT_APP_USE_SDK_SEARCH_BUILDER = true;
REACT_APP_USE_SDK_REPORT_BUILDER = false;

// .env.production
REACT_APP_CENTRALIZED_ERROR_HANDLING = true;
REACT_APP_USE_SDK_SEARCH_BUILDER = true;
REACT_APP_USE_SDK_REPORT_BUILDER = true;
```

### Runtime Toggle Support

```javascript
// Allow override via query string in dev/staging
// ?USE_SDK_SEARCH_BUILDER=false to test rollback
const featureFlags = {
  CENTRALIZED_ERROR_HANDLING:
    getQueryParam("CENTRALIZED_ERROR_HANDLING") ??
    process.env.REACT_APP_CENTRALIZED_ERROR_HANDLING,
  // ... other flags
};
```

### Monitoring & Metrics

Each feature flag should track:

- Deployment timestamp
- User adoption percentage
- Error rate comparison (old vs new)
- Performance metrics (latency, etc.)
- Rollback decision criteria

---

---

## Feature Flag Implementation Details

### Build-Time vs Runtime Configuration

**Build-Time Flags** (Recommended for Production)

```javascript
// src/config/flags.js
export const FEATURE_FLAGS = {
  CENTRALIZED_ERROR_HANDLING:
    process.env.REACT_APP_CENTRALIZED_ERROR_HANDLING === "true",
  USE_SDK_SEARCH_BUILDER:
    process.env.REACT_APP_USE_SDK_SEARCH_BUILDER === "true",
  USE_SDK_REPORT_BUILDER:
    process.env.REACT_APP_USE_SDK_REPORT_BUILDER === "true",
  USE_SDK_RECORD_BUILDER:
    process.env.REACT_APP_USE_SDK_RECORD_BUILDER === "true",
  USE_SDK_TYPE_BUILDER: process.env.REACT_APP_USE_SDK_TYPE_BUILDER === "true",
  USE_SDK_CHIP_ADAPTER: process.env.REACT_APP_USE_SDK_CHIP_ADAPTER === "true",
  USE_SDK_URL_COMPAT: process.env.REACT_APP_USE_SDK_URL_COMPAT === "true",
  USE_SDK_REPORT_COMPONENTS:
    process.env.REACT_APP_USE_SDK_REPORT_COMPONENTS === "true",
  USE_RTKQUERY_CACHE: process.env.REACT_APP_USE_RTKQUERY_CACHE === "true",
};
```

**Runtime Toggle** (Dev/Staging Only)

```javascript
// src/utils/featureFlags.js
export const getFeatureFlag = (flagName) => {
  // Dev/staging: allow query param override
  if (process.env.NODE_ENV !== "production") {
    const queryParam = new URLSearchParams(window.location.search).get(
      flagName,
    );
    if (queryParam !== null) {
      return queryParam === "true";
    }
  }
  // Use build-time config
  return FEATURE_FLAGS[flagName];
};
// Usage: getFeatureFlag('USE_SDK_SEARCH_BUILDER')
```

---

### Phase-by-Phase Rollout Strategy

#### Phase 1 (Current)

**Flags Active**: `CENTRALIZED_ERROR_HANDLING` (dev only)

```bash
# .env.development
REACT_APP_CENTRALIZED_ERROR_HANDLING=true
REACT_APP_USE_SDK_SEARCH_BUILDER=false
# ... all others false

# .env.staging
(All flags false - Phase 1 is docs/testing only)

# .env.production
(All flags false - Phase 1 is docs/testing only)
```

#### Phase 2 Rollout (URL Builders)

**Flags Active**: `USE_SDK_SEARCH_BUILDER`, `USE_SDK_REPORT_BUILDER`, `USE_SDK_RECORD_BUILDER`, `USE_SDK_TYPE_BUILDER`, `USE_SDK_CHIP_ADAPTER`

**Rollout Schedule**:

- Week 1: Dev environment (all flags true)
- Week 2: Staging (50% traffic)
- Week 3: Staging (100% traffic)
- Week 4: Production (10% traffic → 25% → 50% → 100%)

```bash
# .env.development
REACT_APP_CENTRALIZED_ERROR_HANDLING=true
REACT_APP_USE_SDK_SEARCH_BUILDER=true
REACT_APP_USE_SDK_REPORT_BUILDER=true
REACT_APP_USE_SDK_RECORD_BUILDER=true
REACT_APP_USE_SDK_TYPE_BUILDER=true
REACT_APP_USE_SDK_CHIP_ADAPTER=true
REACT_APP_USE_SDK_URL_COMPAT=false
# ... others false

# .env.staging (Week 2-3)
REACT_APP_CENTRALIZED_ERROR_HANDLING=true
REACT_APP_USE_SDK_SEARCH_BUILDER=true
REACT_APP_USE_SDK_REPORT_BUILDER=true
REACT_APP_USE_SDK_RECORD_BUILDER=true
REACT_APP_USE_SDK_TYPE_BUILDER=true
REACT_APP_USE_SDK_CHIP_ADAPTER=true
REACT_APP_USE_SDK_URL_COMPAT=false

# .env.production (Week 4+)
REACT_APP_CENTRALIZED_ERROR_HANDLING=true
REACT_APP_USE_SDK_SEARCH_BUILDER=true  (staged rollout via canary)
REACT_APP_USE_SDK_REPORT_BUILDER=true  (staged rollout via canary)
REACT_APP_USE_SDK_RECORD_BUILDER=true  (staged rollout via canary)
REACT_APP_USE_SDK_TYPE_BUILDER=true    (staged rollout via canary)
REACT_APP_USE_SDK_CHIP_ADAPTER=true    (staged rollout via canary)
REACT_APP_USE_SDK_URL_COMPAT=false
```

---

### Rollback Procedures

#### Quick Rollback (< 15 minutes)

1. Set environment variable to `false`
2. Re-run build
3. Deploy new version
4. Verify in staging first

**Example**:

```bash
# If USE_SDK_SEARCH_BUILDER causing issues:
REACT_APP_USE_SDK_SEARCH_BUILDER=false npm run build:production
npm run deploy  # CI/CD deploys new build
```

#### Graceful Degradation (No rebuild needed)

```javascript
// src/utils/featureFlags.js
export const safeFeatureFlag = (flagName, defaultValue = false) => {
  try {
    return getFeatureFlag(flagName);
  } catch (error) {
    console.error(
      `Feature flag ${flagName} error, using default: ${defaultValue}`,
    );
    return defaultValue; // Safe fallback
  }
};
```

---

### CI Validation Gates

#### Build-Time Validation

```bash
# .github/workflows/build.yml
- name: Validate feature flags
  run: |
    # Check all flags are defined
    node scripts/validate-feature-flags.js
    # Check no flag typos
    grep -r "REACT_APP_USE_" src/ || exit 1
```

**Script**: `scripts/validate-feature-flags.js`

```javascript
const expectedFlags = [
  "CENTRALIZED_ERROR_HANDLING",
  "USE_SDK_SEARCH_BUILDER",
  "USE_SDK_REPORT_BUILDER",
  "USE_SDK_RECORD_BUILDER",
  "USE_SDK_TYPE_BUILDER",
  "USE_SDK_CHIP_ADAPTER",
  "USE_SDK_URL_COMPAT",
  "USE_SDK_REPORT_COMPONENTS",
  "USE_RTKQUERY_CACHE",
];

const defined = Object.keys(process.env)
  .filter((k) => k.startsWith("REACT_APP_"))
  .map((k) => k.replace("REACT_APP_", ""));

const missing = expectedFlags.filter((f) => !defined.includes(f));
if (missing.length > 0) {
  console.error("Missing feature flags:", missing);
  process.exit(1);
}
```

#### Runtime Validation

```javascript
// src/utils/flagsValidator.test.js
describe("Feature flags", () => {
  test("all flags exist and are boolean", () => {
    Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
      expect(typeof value).toBe("boolean");
      expect(
        ["CENTRALIZED", "SDK", "RTKQUERY"].some((prefix) =>
          key.includes(prefix),
        ),
      ).toBe(true);
    });
  });
});
```

---

### Canary Deployment Strategy (Phase 2+)

**For Staged Rollout**:

```yaml
# deploy/canary.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: genomehubs-ui-canary
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: genomehubs-ui
          env:
            - name: REACT_APP_USE_SDK_SEARCH_BUILDER
              value: "true" # Canary gets new flag
      nodeSelector:
        canary: "true" # Routes 5-10% traffic
---
# deploy/stable.yaml
(keeps old flag values)
```

---

### Metrics & Monitoring

#### Per-Flag Telemetry

```javascript
// src/utils/telemetry.js
export const trackFlagUsage = (flagName, flagValue) => {
  analytics.track("feature_flag_active", {
    flag: flagName,
    value: flagValue,
    timestamp: new Date().toISOString(),
  });
};

// Initialize on app start
Object.entries(FEATURE_FLAGS).forEach(([flagName, flagValue]) => {
  trackFlagUsage(flagName, flagValue);
});
```

#### Error Rate Tracking

```javascript
// src/utils/errorTracking.js
export const trackError = (error, context) => {
  const flags = Object.entries(FEATURE_FLAGS)
    .filter(([, value]) => value)
    .map(([key]) => key);

  logger.error(error, {
    ...context,
    activeFlags: flags,
  });
};
```

**Dashboard Metrics** (Suggested)

- Error rate by flag (old vs new implementation)
- Latency by flag (performance regression check)
- User adoption by flag
- Rollback decision criteria (error rate > 2% = automatic rollback)

---

## Phase 1 Action Items

### High Priority

- [ ] Create migration ledger spreadsheet (owned by: TBD)
- [ ] Document sortReportQuery() validation rules (blocks Phase 2)
- [ ] Set up feature flag infrastructure (build-time environment variables)
- [ ] Create flag validation script (validate-feature-flags.js)
- [ ] Define canary deployment strategy
- [ ] Create telemetry tracking for flags
- [ ] Define monitoring/metrics for each flag

### Medium Priority

- [ ] Create rollback procedures for each flag
- [ ] Test feature flag toggle in dev environment
- [ ] Document flag override behavior for QA testing

### Low Priority

- [ ] Set up automated flag audit tests (verify all flags used correctly)
- [ ] Create runbook for flag rollout process

---

## Success Criteria (Phase 1 Exit)

- [ ] Migration ledger complete and reviewed
- [ ] All 35+ sortReportQuery() rules documented
- [ ] Feature flag map finalized with deployment timeline
- [ ] Rollback procedures documented for each flag
- [ ] Feature flag infrastructure ready for Phase 2

---

## References

- **Phase 1 URL Inventory**: `PHASE-1-URL-INVENTORY.md`
- **Phase 1 Search Parity**: `PHASE-1-SEARCH-PARITY.md`
- **AGENTS.md**: Core constraints and DRY rules
- **Phased-refactor.md**: Overall architecture roadmap
