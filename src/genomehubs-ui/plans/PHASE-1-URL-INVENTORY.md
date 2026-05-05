# Phase 1: URL Composition Inventory

**Status**: Phase 1 - Baseline & Controls  
**Last Updated**: May 2026  
**Scope**: All URL building and parsing locations in genomehubs-ui

## Overview

This inventory maps all locations where URLs are composed, parsed, or manipulated. Each entry identifies whether it should be migrated to a centralized builder, retained as-is, or deprecated.

**ADDITION**: This inventory now includes **URL composition in reducers and selectors** (previously incomplete).

---

## CRITICAL: Hash/Lookup Redundancy (Deprecation Opportunity)

**Current Pattern** (Redundant):

```
/search?query=Homo#Homo
        ↑           ↑
    Query param   Hash term
    (search)     (display/lookup)
```

**Issue**:

- URL has BOTH query parameter (`?query=Homo`) AND hash (`#Homo`)
- SearchPage uses: `setLookupTerm(options.query || hashTerm)` - always prefers query param
- Hash is only used as fallback (for old URLs)
- This wastes URL space and creates maintenance complexity

**Backup Mechanism**:

- **Current Logic** (SearchPage.jsx:158): `setLookupTerm(options.query || hashTerm)`
- Prioritizes query param → shows in search box
- Falls back to hash if query param missing (backward compatibility)

**Deprecation Plan**:

- **Phase 3**: Add compatibility layer to normalize legacy hash-based URLs to query-based URLs
- **Phase 4**: Migrate all internal URL generation to use query params only
- **Phase 5+**: Remove hash support entirely (old URLs automatically redirected)

**Action Items for Phase 1**:

- [ ] Document all current URL patterns with hash (inventory below)
- [ ] Identify all old URL sources that might still use hash
- [ ] Plan redirect strategy for legacy URLs in Phase 3
- [ ] Test backward compatibility during Phase 2-3

---

## 1. Search Query Composition

### Primary: `src/client/views/selectors/search.js`

| Location  | Lines   | Function            | Purpose                                 | Status      | Priority |
| --------- | ------- | ------------------- | --------------------------------------- | ----------- | -------- |
| search.js | 30-130  | buildSearchUrl()    | Constructs `/search` query strings      | **MIGRATE** | P1       |
| search.js | 40-70   | encodeQueryTerms()  | Encodes search operators (AND, OR, NOT) | **MIGRATE** | P1       |
| search.js | 131-420 | handleBatchSearch() | POST `/msearch` batch endpoint          | **MIGRATE** | P1       |
| qs.js     | 1-80    | parse()             | Query string parsing utility            | **RETAIN**  | P0       |
| qs.js     | 81-150  | stringify()         | Query string encoding utility           | **RETAIN**  | P0       |

**Decision**: Consolidate into `queryBuilder` adapter in Phase 2

---

## 2. Report Query Composition

### Primary: `src/client/views/selectors/report.js`

| Location  | Lines   | Function          | Purpose                                           | Status      | Priority |
| --------- | ------- | ----------------- | ------------------------------------------------- | ----------- | -------- |
| report.js | 34-160  | sortReportQuery() | **CRITICAL**: Validates 35+ params by report type | **LOCK**    | P0       |
| report.js | 161-250 | buildReportUrl()  | Constructs `/report` endpoint URL                 | **MIGRATE** | P1       |
| report.js | 251-400 | getCachedReport() | ID-based report caching & retrieval               | **RETAIN**  | P0       |

**ALERT**: `sortReportQuery()` validation rules are production-critical. Document all 35+ rules before Phase 2 changes.

**Decision**: Document sortReportQuery() rules → Create validation schema Phase 2

---

## 3. Record/Specimen Composition

### Primary: `src/client/views/selectors/record.js`

| Location  | Lines  | Function         | Purpose                                | Status          | Priority |
| --------- | ------ | ---------------- | -------------------------------------- | --------------- | -------- |
| record.js | 31-90  | buildRecordUrl() | Manual URL concatenation for `/record` | **CONSOLIDATE** | P2       |
| record.js | 91-150 | parseRecordId()  | Extracts record ID from URL/props      | **RETAIN**      | P0       |

**Issue**: Manual string concatenation - needs consolidation into builder

**Decision**: Phase 2 - Consolidate into urlBuilder

---

## 4. Taxonomy/Type System

### Primary: `src/client/views/selectors/types.js`

| Location | Lines   | Function            | Purpose                               | Status          | Priority |
| -------- | ------- | ------------------- | ------------------------------------- | --------------- | -------- |
| types.js | 492-530 | fetchResultFields() | Manual URL concat for `/resultFields` | **CONSOLIDATE** | P2       |
| types.js | 1-50    | fetchTaxonomy()     | Manual URL concat for `/taxonomy`     | **CONSOLIDATE** | P2       |

**Issue**: Multiple manual URL concatenations - consolidate pattern

**Decision**: Phase 2 - Create typeSystemBuilder

---

## 5. Reducer URL Composition (Location Management)

### Primary: `src/client/views/reducers/location.js`

| Location    | Lines   | Function         | Purpose                           | Status        | Priority |
| ----------- | ------- | ---------------- | --------------------------------- | ------------- | -------- |
| location.js | 160-230 | updatePathname() | Syncs pathname+hash+query to URL  | **RETAIN**    | P0       |
| location.js | 216-226 | toggleHash()     | Toggles hash value in URL         | **DEPRECATE** | P3       |
| location.js | 231-240 | removeHash()     | Removes hash from URL             | **DEPRECATE** | P3       |
| location.js | 170-180 | history.push()   | Updates browser history with hash | **DEPRECATE** | P3       |

**Critical Code** (lines 168-184):

```javascript
let hash = getHashString(state);
let search = getQueryString(state);
history.push({ pathname, hash, search }); // Includes hash term
```

**Issue**: Hash is passed to history.push() but duplicates search query parameter

**Deprecation Path**:

- Phase 3: Stop including hash in history.push()
- Phase 3: Update toggleHash() and removeHash() to be no-ops
- Phase 4: Remove hash handling entirely

**Decision**: RETAIN through Phase 2 for backward compatibility, DEPRECATE in Phase 3

---

## 6. Additional Selector URL Builders (All Manual Concatenations)

### These all need consolidation into adapters:

| File             | Lines | Endpoint                  | Purpose                             | Status          | Priority |
| ---------------- | ----- | ------------------------- | ----------------------------------- | --------------- | -------- |
| phylopic.js      | 37-50 | `/phylopic`               | Fetch phylopic images               | **CONSOLIDATE** | P2       |
| descendants.js   | 38-45 | `/search`                 | Fetch descendants with manual query | **CONSOLIDATE** | P2       |
| checkProgress.js | 13-20 | `/progress`               | Check query progress                | **CONSOLIDATE** | P2       |
| file.js          | 19-25 | `/search`                 | File export search                  | **CONSOLIDATE** | P2       |
| analysis.js      | 21-30 | `/search`                 | Analysis search                     | **CONSOLIDATE** | P2       |
| explore.js       | 28-35 | `/summary`                | Explore summary data                | **CONSOLIDATE** | P2       |
| tree.js          | 58-70 | `/report` (tree)          | Tree visualization report           | **CONSOLIDATE** | P2       |
| taxonomy.js      | 26-45 | `/taxonomies`, `/indices` | Taxonomy metadata                   | **CONSOLIDATE** | P2       |
| pages.js         | 31-57 | `/assets/markdown/*`      | Dynamic page loading                | **RETAIN**      | P0       |

**Decision**: Consolidate into `apiBuilder` adapter library in Phase 2

---

## 7. Navigation & Search State URL Sync

### Primary: `src/client/views/components/SearchPage.jsx`

| Location       | Lines   | Function         | Purpose                                 | Status     | Priority |
| -------------- | ------- | ---------------- | --------------------------------------- | ---------- | -------- |
| SearchPage.jsx | 100-200 | handleSearch()   | Sync search state to URL via navigate() | **RETAIN** | P0       |
| SearchPage.jsx | 201-300 | parseUrlParams() | Parse incoming URL params to Redux      | **RETAIN** | P0       |
| Page.jsx       | 50-150  | updatePageUrl()  | Mirror page state to URL query string   | **RETAIN** | P0       |

**Pattern**: URL ↔ Redux state bidirectional sync (enables bookmarking)

**Decision**: RETAIN - this is architecture pattern, not migration candidate

---

## 8. Report Entry Points (Parameter Ingestion)

### Report parameter flow:

| Stage             | Component         | File       | Lines                                | Handling                     |
| ----------------- | ----------------- | ---------- | ------------------------------------ | ---------------------------- | ---------- |
| URL param parsing | ReportItem.jsx    | 150-250    | Extract query/result/report from URL | **RETAIN**                   |
| Validation        | sortReportQuery() | report.js  | 34-160                               | Filter params by type        | **LOCK**   |
| State storage     | reportSlice       | report.js  | 400-500                              | Redux state management       | **RETAIN** |
| Component props   | Report.jsx        | Report.jsx | 1-100                                | Render component with params | **RETAIN** |

**Critical Path**: URL params → sortReportQuery() → Redux → Report component

---

## 9. Fetch Call Sites

### Search fetches:

```javascript
// Location: search.js lines 70-130
fetch(`${API_URL}/search?${queryString}`)
  .then((r) => r.json())
  .then((data) => dispatch(receiveSearch(data)))
  .catch((err) => dispatch(searchError(err)));
```

**Status**: RETAIN (but wrap for error handling in Phase 1)

### Report fetches:

```javascript
// Location: report.js lines 161-250
fetch(`${API_URL}/report?${reportQuery}&queryId=${id}`)
  .then((r) => r.json())
  .then((data) => dispatch(receiveReport(data)));
```

**Status**: RETAIN (critical for visualization rendering)

### Batch search (msearch):

```javascript
// Location: search.js lines 131-420
fetch(`${API_URL}/msearch`, {
  method: "POST",
  body: JSON.stringify(queries),
});
```

**Status**: RETAIN (used for multi-template searches)

---

## 10. String Parsing & Chip Query Generation

### Chip-to-query conversion:

| Location         | File    | Lines          | Function                      | Issue                      | Status      |
| ---------------- | ------- | -------------- | ----------------------------- | -------------------------- | ----------- |
| ChipSearch.jsx   | 200-300 | chipToString() | Manual chip string generation | Manual parsing brittleness | CONSOLIDATE |
| QueryBuilder.jsx | 50-150  | parseChips()   | Reverse: string → chips       | Inconsistency risk         | CONSOLIDATE |

**Decision**: Phase 2 - Create chip-to-query adapter with bidirectional parity tests

---

## 11. Legacy Query String Handling

### Key parsing locations:

```javascript
// Location: qs.js (GOOD - centralized)
const parse = (qs) => {
  /* RFC 3986 compliant */
};
const stringify = (obj) => {
  /* URL encode */
};
```

**Status**: RETAIN - already centralized, well-tested (13 unit tests)

---

## 12. URL Routes (React Router)

### Search routes:

```
/search?query=...&result=...&filters=...
```

**Handling**: SearchPage.jsx → parseUrlParams() → Redux

### Report routes:

```
/report?query=...&result=...&report=tree&treeThreshold=5
```

**Handling**: ReportItem.jsx → sortReportQuery() → Redux

### Record routes:

```
/record/taxon/Homo_sapiens
```

**Handling**: RecordPage.jsx → parseRecordId() → Redux

**Status**: RETAIN (routes are stable, well-tested in Phase 0)

---

## Migration Classification Summary

| Category              | Count | Action                                                   | Timeline  |
| --------------------- | ----- | -------------------------------------------------------- | --------- |
| MIGRATE to builder    | 5     | Create queryBuilder adapter                              | Phase 2   |
| CONSOLIDATE patterns  | 12+   | Refactor manual concatenations (selectors + reducers)    | Phase 2-3 |
| LOCK (critical rules) | 1     | Document sortReportQuery()                               | Phase 1   |
| RETAIN (working)      | 10+   | Keep as-is, wrap with error handling                     | Phase 1   |
| DEPRECATE             | 3     | Hash functions (toggleHash, removeHash, hash in history) | Phase 3   |

---

## Phase 1 Action Items

### High Priority

- [ ] Document all 25+ URL composition points (selectors + reducers)
- [ ] Each classified as MIGRATE/CONSOLIDATE/LOCK/RETAIN/DEPRECATE
- [ ] **Hash/lookup redundancy**: Create deprecation timeline
  - [ ] Identify all URLs currently using hash format
  - [ ] Test backward compatibility mechanism (options.query || hashTerm)
  - [ ] Plan Phase 3 redirect strategy
- [ ] Document all 35+ rules in `sortReportQuery()` with test cases
- [ ] Map data fetch error handling patterns
- [ ] Test URL roundtrip: parse → build → parse (identity)

### Medium Priority

- [ ] Identify ALL manual URL concatenations (12+ found in selectors)
- [ ] Create URL builder adapter skeleton for all endpoint types
- [ ] Document chip-to-query generation logic with test cases
- [ ] Plan reduction of reducer/selector manual URL building

### Low Priority

- [ ] Consolidate navigation URL sync patterns
- [ ] Plan fetch error handling wrapper
- [ ] Create deprecation notices for hash-based URLs

---

## Validation Checklist

- [ ] All 25+ URL composition points enumerated
- [ ] Each classified as MIGRATE/CONSOLIDATE/LOCK/RETAIN/DEPRECATE
- [ ] Reducer URL composition included (location.js)
- [ ] Hash deprecation plan documented
- [ ] Dependencies and blockers identified
- [ ] Test coverage needs documented
- [ ] Migration ledger updated with status

---

## References

- Phase 0 Tests: `src/client/views/functions/__tests__/url.integration.test.js` (20 tests - URL roundtrips)
- Query Parser: `src/client/views/functions/qs.js` (9 tests - parsing/encoding)
- Report Validation: `src/client/views/selectors/report.js:34-160`
- Location Management: `src/client/views/reducers/location.js` (hash/query composition)
- Search Hash Logic: `src/client/views/components/SearchPage.jsx:49-158` (hash fallback pattern)
- Hash Toggle Logic: `src/client/views/reducers/location.js:216-240` (toggleHash, removeHash)
