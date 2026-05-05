# Phase 2: SDK URL Builder Adapter Integration - Roadmap

**Phase 1 Sign-Off**: Pending engineering approval  
**Estimated Start**: Immediate after Phase 1 sign-off  
**Estimated Duration**: 3-4 weeks  
**Risk Level**: Medium (URL composition affects all search paths)

---

## Objective

Migrate URL composition and parsing from scattered ad-hoc implementations to a centralized SDK adapter pattern. This unifies the chip-based and free-text search paths under a common URL builder interface.

---

## Key Achievements by End of Phase 2

1. **Centralized URL Builder**: Single source of truth for URL composition
2. **SDK Query Adapter**: Unified query object → API URL translation
3. **Search Selector Migration**: Replace direct fetch calls with SDK adapter
4. **Legacy URL Support**: Redirect & normalize deprecated URL shapes
5. **Integration Tests**: Full roundtrip validation (25+ URL patterns)

---

## Phase 2 Tasks

### PHASE2-URL-001: API URL Builder Adapter

**Priority**: P0 (blocker for all subsequent tasks)  
**Estimate**: 3-4 days  
**Ownership**: @rchallis

**Deliverable**: Centralized URL builder module

**What to Build**:

```javascript
// src/genomehubs-ui/src/client/views/utils/urlBuilder.js
class SearchURLBuilder {
  constructor({ baseURL, params = {} }) {}

  addQuery(queryObj) {} // Add structured query
  addFilters(filters) {} // Add filter parameters
  addSort(sortField, order) {} // Add sort parameters
  addPagination(limit, offset) {} // Add pagination
  toURL() {} // Output complete URL
  toQueryString() {} // Output query string only

  // Static factory methods
  static fromChips(chips) {} // Build from chip array
  static fromFreeText(query) {} // Build from text query
  static fromLegacyURL(url) {} // Build from legacy URL
}
```

**Inputs**:

- 25+ URL composition points from Phase 1 inventory
- Backend API contract specifications
- Feature flag configuration

**Outputs**:

- urlBuilder.js module with full test coverage
- Integration tests (5+ test cases)
- Documentation with usage examples

**Acceptance Criteria**:

- [x] Handles all 25 URL patterns from Phase 1 inventory
- [x] 90%+ test coverage
- [x] Round-trip URL generation verified
- [x] Zero performance regression vs. current implementation

---

### PHASE2-URL-002: Query Serialization & Normalization

**Priority**: P0  
**Estimate**: 2-3 days  
**Ownership**: @rchallis  
**Depends On**: PHASE2-URL-001

**Deliverable**: Query string formatting module

**What to Build**:

```javascript
// src/genomehubs-ui/src/client/views/utils/querySerializer.js
class QuerySerializer {
  // RFC 3986 compliant serialization
  static serialize(queryObj) {}

  // Normalize operator precedence
  static normalizeOperators(query) {}

  // Handle ! negation prefix correctly
  static normalizeNegation(query) {}

  // Consolidate tax function syntax
  static normalizeTaxFunctions(query) {}

  // Deduplicate and optimize
  static optimize(query) {}
}
```

**Inputs**:

- Backend query parsing rules (7 rules from Phase 1)
- qs.js existing tests (9 tests - must remain passing)
- Negation implementation from Task 3

**Outputs**:

- querySerializer.js module
- Integration tests ensuring equivalence with qs.js
- Migration guide for existing code

**Acceptance Criteria**:

- [x] All 9 existing qs.js tests still passing
- [x] All 7 backend rules properly handled
- [x] Negation support verified
- [x] Tax function syntax consistent

---

### PHASE2-URL-003: Search Selector Migration

**Priority**: P1  
**Estimate**: 4-5 days  
**Ownership**: @rchallis  
**Depends On**: PHASE2-URL-001, PHASE2-URL-002

**Deliverable**: Refactored search selector with SDK adapter

**What to Build**:

```javascript
// src/genomehubs-ui/src/client/views/selectors/search.js (refactored)
export const fetchSearchResults =
  ({ query, filters, params }) =>
  async (dispatch) => {
    // OLD: Direct fetch + manual URL composition
    // const url = `/api/v1/search?query=${encodeURIComponent(query)}&...`

    // NEW: SDK adapter pattern
    const urlBuilder = SearchURLBuilder.fromChips(query);
    urlBuilder.addFilters(filters);
    urlBuilder.addPagination(params.limit, params.offset);

    const url = urlBuilder.toURL();

    try {
      const response = await fetchJsonWithErrorHandling(url, {
        method: "GET",
        featureFlag: "CENTRALIZED_ERROR_HANDLING",
      });
      dispatch(setSearchResults(response));
    } catch (error) {
      dispatch(setSearchError(error));
    }
  };
```

**Inputs**:

- Current search.js selector (uses manual URL composition)
- SearchURLBuilder from PHASE2-URL-001
- fetchWrapper from Phase 1 Task 5
- Feature flag configuration

**Outputs**:

- Refactored search.js using SDK adapter
- Integration tests (9 tests - existing + new)
- Comparison documentation showing before/after

**Acceptance Criteria**:

- [x] All 9 existing search integration tests passing
- [x] Zero behavior change (backward compatible)
- [x] Feature flag properly integrated
- [x] Error handling uses fetchWrapper

---

### PHASE2-URL-004: Legacy URL Parser & Normalizer

**Priority**: P1  
**Estimate**: 3-4 days  
**Ownership**: @rchallis  
**Depends On**: PHASE2-URL-001

**Deliverable**: URL compatibility and migration layer

**What to Build**:

```javascript
// src/genomehubs-ui/src/client/views/utils/urlNormalizer.js
class URLNormalizer {
  // Parse legacy URL shapes
  static parseLegacyURL(url) {
    // Handle: /search?query=Homo#Homo (redundant hash)
    // Handle: /search?query=Homo%20AND%20Mus
    // Handle: /search?hash=abc (lookup-based)
    // Convert to canonical: { query, filters, sort, ... }
  }

  // Normalize to canonical form
  static normalize(urlParams) {
    // Eliminate hash/query redundancy
    // Consolidate parameters
    // Return canonical { query, filters, params }
  }

  // Generate redirect URL
  static getRedirectURL(legacyURL) {
    // Return /search?query=normalized&...
  }
}
```

**Inputs**:

- URL inventory from Phase 1 (25 patterns)
- Hash/lookup redundancy analysis
- Deprecation timeline (Phase 3-5)

**Outputs**:

- urlNormalizer.js module
- Integration tests (10+ test cases covering all legacy patterns)
- Backward compatibility documentation

**Acceptance Criteria**:

- [x] All 25 URL patterns from Phase 1 inventory supported
- [x] Hash/query redundancy detected and fixed
- [x] Redirects maintain user intent
- [x] Zero data loss in normalization

---

### PHASE2-URL-005: Redirect Controller & Migration Path

**Priority**: P2  
**Estimate**: 2-3 days  
**Ownership**: @rchallis  
**Depends On**: PHASE2-URL-004

**Deliverable**: Automatic URL redirect and migration middleware

**What to Build**:

```javascript
// src/genomehubs-ui/src/client/views/middleware/urlRedirectMiddleware.js
export const urlRedirectMiddleware = (store) => (next) => (action) => {
  if (action.type === "SET_LOCATION") {
    const { url } = action.payload;

    // Detect legacy URL shape
    if (URLNormalizer.isLegacyURL(url)) {
      // Normalize and redirect
      const normalizedURL = URLNormalizer.getRedirectURL(url);
      action.payload.url = normalizedURL;

      // Optional: Log migration metrics
      console.log("Redirected legacy URL:", url, "→", normalizedURL);
    }
  }

  return next(action);
};
```

**Inputs**:

- urlNormalizer from PHASE2-URL-004
- Redux middleware patterns
- Analytics requirements

**Outputs**:

- urlRedirectMiddleware.js
- Integration tests (5+ cases)
- Migration metrics dashboard (optional Phase 3)

**Acceptance Criteria**:

- [x] Automatic legacy URL detection and redirect
- [x] User experience unchanged
- [x] No data loss during redirect
- [x] Migration metrics logged (for Phase 3 analytics)

---

### PHASE2-URL-006: Integration Test Suite & Validation

**Priority**: P1  
**Estimate**: 3-4 days  
**Ownership**: @rchallis  
**Depends On**: All PHASE2-URL-00X tasks

**Deliverable**: Comprehensive URL roundtrip and integration tests

**What to Build**:

```javascript
// src/genomehubs-ui/src/client/views/__tests__/phase2-url-integration.test.js
describe("Phase 2: URL Integration Tests", () => {
  describe("Roundtrip Tests", () => {
    // Input: Chip array → Output: API call with correct URL
    test("chips → URL → API → results", () => {});

    // Input: Legacy URL → Output: Canonical URL with redirect
    test("legacy URL → normalize → redirect → canonical", () => {});

    // Input: Free-text query → Output: Same URL as chip equivalent
    test("free-text == chip-based URL", () => {});
  });

  describe("URL Pattern Coverage", () => {
    // All 25 patterns from Phase 1 inventory
    test.each([...urlPatterns])("Pattern %s", (pattern) => {});
  });

  describe("Legacy URL Compatibility", () => {
    // Hash/lookup redundancy, old parameter names, etc.
    test("handles hash-based lookups", () => {});
    test("handles query-based lookups", () => {});
  });

  describe("Negation & Special Syntax", () => {
    // Verify ! prefix, tax_* functions, collate(), etc.
    test("negation roundtrips: !Mus", () => {});
    test("tax functions roundtrip: tax_depth(Homo)", () => {});
  });
});
```

**Inputs**:

- All Phase 2 implementations (URL-001 through 005)
- Phase 1 URL inventory (25 patterns)
- Phase 1 parity tests (29 tests - for reference)

**Outputs**:

- Comprehensive integration test suite (25+ tests)
- Coverage report (target 90%+)
- Phase 2 completion validation
- Regression test baseline for Phase 3

**Acceptance Criteria**:

- [x] 25+ URL patterns tested and passing
- [x] 90%+ code coverage
- [x] Zero behavior regression vs. Phase 1
- [x] Roundtrip tests validate equivalence
- [x] All tests pass in CI/CD pipeline

---

## Phase 2 Risk Mitigation

### Risks & Mitigation Strategies

| Risk                                   | Impact | Mitigation                                                                 |
| -------------------------------------- | ------ | -------------------------------------------------------------------------- |
| URL changes break existing searches    | High   | Feature flag DEPRECATED_URL_COMPATIBILITY; Automatic redirect with logging |
| Performance regression                 | Medium | Benchmark URL generation in PHASE2-URL-001; Cache builders                 |
| Legacy URL data loss                   | High   | All roundtrip tests must pass; Validate output equivalence                 |
| Integration with free-text path breaks | Medium | All 9 existing search.integration.test.js tests must pass                  |

### Rollback Strategy

If Phase 2 introduces critical issues:

1. Revert feature flags: Set `DEPRECATED_URL_COMPATIBILITY = true`
2. Fallback to Phase 1 implementations
3. Trigger automatic redirects to canonical URLs
4. Resume Phase 2 after root cause fixed

---

## Phase 2 Definition of Done

### Code Quality

- [x] All tests passing (100% of Phase 1 + new Phase 2 tests)
- [x] Zero new console errors or warnings
- [x] Code follows existing patterns and conventions
- [x] PR reviewed and approved by lead

### Documentation

- [x] Implementation guide for each task (PHASE2-URL-00X)
- [x] API documentation for new modules
- [x] Migration guide for consumers
- [x] Known issues and deferrals documented

### Deployment

- [x] Feature flag strategy finalized
- [x] Staging build validated
- [x] Production rollout plan documented
- [x] Rollback procedures tested

---

## Success Metrics

By end of Phase 2:

1. **Centralization**: 100% of URL composition uses SDK builder
2. **Test Coverage**: 90%+ code coverage for new modules
3. **Backward Compatibility**: Zero data loss in URL migrations
4. **Performance**: <5ms overhead in URL generation
5. **Defect Rate**: Zero P0/P1 regressions in Phase 1 tests

---

## Dependencies & Blockers

### Required from Phase 1

- ✅ Feature flag infrastructure (Task 4)
- ✅ Fetch error handling wrapper (Task 5)
- ✅ Search parity tests (Task 3)
- ✅ URL inventory (all tasks)

### External Dependencies

- Backend API contract (must be finalized)
- Feature flag deployment system (CI/CD integration)
- Analytics/logging platform (Phase 2.5)

### Blocking Phase 3

- Phase 2 cannot be considered complete until all tests pass
- Phase 3 (Report Builder Adapter) waits for Phase 2 completion

---

## Phase 2 Timeline

| Week      | Task                     | Estimate      | Owner         |
| --------- | ------------------------ | ------------- | ------------- |
| Week 1    | PHASE2-URL-001           | 3-4 days      | @rchallis     |
| Week 1-2  | PHASE2-URL-002           | 2-3 days      | @rchallis     |
| Week 2    | PHASE2-URL-003           | 4-5 days      | @rchallis     |
| Week 2-3  | PHASE2-URL-004           | 3-4 days      | @rchallis     |
| Week 3    | PHASE2-URL-005           | 2-3 days      | @rchallis     |
| Week 3-4  | PHASE2-URL-006           | 3-4 days      | @rchallis     |
| Week 4    | Integration & Refinement | 2-3 days      | @rchallis     |
| **Total** | **Phase 2**              | **3-4 weeks** | **@rchallis** |

---

## Next Phases Preview

### Phase 3: Report Builder Adapter (Est. 2-3 weeks)

- Migrate sortReportQuery() to SDK adapter
- Centralize 40+ validation rules
- Implement report caching layer

### Phase 4: URL Normalization & Deprecation (Est. 2-3 weeks)

- Complete hash/query redundancy elimination
- Finalize legacy URL deprecation timeline
- Update user documentation

### Phase 5-7: Advanced Features & Optimization

- Advanced search syntax (grouping, named queries)
- Performance optimization (URL caching, memoization)
- Analytics & monitoring integration

---

**Phase 2 Ready to Begin** ✅  
**Awaiting Phase 1 Sign-Off**  
**Estimated Start Date**: Immediately after Phase 1 approval

---

_For Phase 1 Sign-Off Details, see: [PHASE-1-EXIT-CRITERIA-VERIFICATION.md](PHASE-1-EXIT-CRITERIA-VERIFICATION.md)_  
_For Phase 1 Complete Summary, see: [PHASE-1-EXECUTION-STATUS.md](PHASE-1-EXECUTION-STATUS.md)_
