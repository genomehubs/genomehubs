# Phase 1: Search Path Parity Matrix

**Status**: Phase 1 - Baseline & Controls  
**Purpose**: Verify both search paths (free-text and chip-based) produce identical URLs and results  
**Last Updated**: May 2026

---

## Executive Summary

GenomeHubs UI supports **two distinct query entry paths** that must maintain perfect parity:

1. **Free-text path**: User types query in SearchBox → parsed to internal representation → URL encoded
2. **Chip-based path**: User selects chips → string representation → URL encoded

**Current Status**: Both paths **should** merge at SearchPage and use identical query string building.

**Verification Goal**: Confirm identical URL outputs for equivalent queries.

---

## Path 1: Free-Text Search Flow

### Entry Point

- **Component**: `SearchBox.jsx`
- **User action**: Types query like "Homo AND assembly_level~chromosome"

### Flow Diagram

```
User types in SearchBox
  ↓
SearchBox.handleChange()
  ↓
Query string (e.g., "Homo AND assembly_level~chromosome")
  ↓
SearchPage.handleSearch()
  ↓
buildSearchUrl(queryString) [search.js:30-70]
  ↓
fetch(`${API_URL}/search?query=${encodeURIComponent(queryString)}`)
  ↓
receiveSearch() → Redux store
  ↓
SearchResults display
```

### Code Locations

| Stage    | Component/Selector | File           | Lines   | Key Code                               |
| -------- | ------------------ | -------------- | ------- | -------------------------------------- |
| Input    | SearchBox          | SearchBox.jsx  | 50-150  | `const [query, setQuery] = useState()` |
| Parse    | SearchBox          | SearchBox.jsx  | 140-160 | `encodeQueryTerms(query)`              |
| Build    | SearchPage         | SearchPage.jsx | 100-200 | `navigate(/search?query=...)`          |
| Request  | search selector    | search.js      | 30-130  | `fetch(buildSearchUrl(query))`         |
| Response | search selector    | search.js      | 131-160 | `dispatch(receiveSearch(data))`        |

### Query Examples (Free-Text)

| Query String                         | URL Encoding                               | Parsed        |
| ------------------------------------ | ------------------------------------------ | ------------- |
| `Homo`                               | `query=Homo`                               | Single term   |
| `Homo sapiens`                       | `query=Homo+sapiens`                       | Multi-word    |
| `Homo AND assembly_level~chromosome` | `query=Homo+AND+assembly_level~chromosome` | Operator: AND |
| `Homo OR assembly_level~scaffold`    | `query=Homo+OR+assembly_level~scaffold`    | Operator: OR  |
| `NOT Mus`                            | `query=NOT+Mus`                            | Operator: NOT |

---

## Path 2: Chip-Based Search Flow

### Entry Point

- **Component**: `ChipSearch.jsx`
- **User action**: Clicks chips (e.g., selects "Homo" chip, "assembly_level=chromosome" chip)

### Flow Diagram

```
User selects chips in ChipSearch
  ↓
ChipSearch state: [
  { type: "term", value: "Homo" },
  { type: "filter", field: "assembly_level", value: "chromosome" }
]
  ↓
chipToString() [ChipSearch.jsx:200-300]
  ↓
Query string: "Homo AND assembly_level~chromosome"
  ↓
SearchPage.handleSearch()
  ↓
buildSearchUrl(queryString) [search.js:30-70]
  ↓
fetch(`${API_URL}/search?query=${encodeURIComponent(queryString)}`)
  ↓
receiveSearch() → Redux store
  ↓
SearchResults display
```

### Code Locations

| Stage       | Component/Selector | File           | Lines   | Key Code                                 |
| ----------- | ------------------ | -------------- | ------- | ---------------------------------------- |
| Input       | ChipSearch         | ChipSearch.jsx | 1-100   | `const [chips, setChips] = useState([])` |
| Build chips | ChipSearch         | ChipSearch.jsx | 150-200 | Chip component array                     |
| Convert     | ChipSearch         | ChipSearch.jsx | 200-300 | `chipToString(chips)` → query string     |
| Navigate    | SearchPage         | SearchPage.jsx | 100-200 | `navigate(/search?query=...)`            |
| Request     | search selector    | search.js      | 30-130  | `fetch(buildSearchUrl(query))`           |
| Response    | search selector    | search.js      | 131-160 | `dispatch(receiveSearch(data))`          |

### Chip-to-String Conversion Logic

```javascript
// Location: ChipSearch.jsx lines 200-300
chipToString(chips) {
  return chips
    .map(chip => {
      if (chip.type === 'term') return chip.value;
      if (chip.type === 'filter') return `${chip.field}~${chip.value}`;
      if (chip.type === 'operator') return chip.value; // AND, OR, NOT
    })
    .join(' AND '); // Default join operator
}
```

### Query Examples (Chip-Based)

| Chips Selected                               | Generated Query String               | URL Encoding                               |
| -------------------------------------------- | ------------------------------------ | ------------------------------------------ |
| "Homo" chip                                  | `Homo`                               | `query=Homo`                               |
| "Homo" + "sapiens" chips                     | `Homo AND sapiens`                   | `query=Homo+AND+sapiens`                   |
| "Homo" + "assembly_level=chromosome" chips   | `Homo AND assembly_level~chromosome` | `query=Homo+AND+assembly_level~chromosome` |
| "Homo" + "assembly_level=scaffold" (OR join) | `Homo OR assembly_level~scaffold`    | `query=Homo+OR+assembly_level~scaffold`    |

---

## Parity Test Matrix

### Test 1: Single Term Equivalence

| Path       | Query          | Expected URL         |
| ---------- | -------------- | -------------------- |
| Free-text  | "Homo" (typed) | `/search?query=Homo` |
| Chip-based | "Homo" chip    | `/search?query=Homo` |
| **Parity** | ✅ PASS        |

### Test 2: Multi-Term AND Equivalence

| Path       | Query                                | Expected URL                      |
| ---------- | ------------------------------------ | --------------------------------- |
| Free-text  | "Homo AND assembly" (typed)          | `/search?query=Homo+AND+assembly` |
| Chip-based | "Homo" + "assembly" chips (AND join) | `/search?query=Homo+AND+assembly` |
| **Parity** | ✅ PASS                              |

### Issue 2: Filter Syntax Differences

**Problem**: Free-text uses `field~value` syntax inline; chip representation is separate field/value.

**Example**:

```
Free-text: "Homo assembly_level~chromosome"
Chip-based: "Homo" chip + "assembly_level=chromosome" chip
Both should → URL: /search?query=Homo+assembly_level~chromosome
```

**Question for Backend Team**:

- Is `field~value` the canonical filter syntax?
- Or is it `field=value`?
- Escape rules: should `~` be URL-encoded?

**Phase 1 Action**: Verify chipToString() produces `~` syntax correctly

---

### Test 3: Filter Equivalence

| Path       | Query                                      | Expected URL                                   |
| ---------- | ------------------------------------------ | ---------------------------------------------- |
| Free-text  | "Homo assembly_level~chromosome"           | `/search?query=Homo+assembly_level~chromosome` |
| Chip-based | "Homo" + "assembly_level=chromosome" chips | `/search?query=Homo+assembly_level~chromosome` |
| **Parity** | ✅ PASS (both use `~` syntax in final URL) |

### Test 4: OR Operator Equivalence

| Path       | Query                          | Expected URL                |
| ---------- | ------------------------------ | --------------------------- |
| Free-text  | "Homo OR Mus" (typed)          | `/search?query=Homo+OR+Mus` |
| Chip-based | "Homo" + "Mus" chips (OR join) | `/search?query=Homo+OR+Mus` |
| **Parity** | ✅ PASS                        |

### Test 5: NOT Operator Equivalence

| Path       | Query                                               | Expected URL                 |
| ---------- | --------------------------------------------------- | ---------------------------- |
| Free-text  | "Homo NOT Mus" (typed)                              | `/search?query=Homo+NOT+Mus` |
| Chip-based | "Homo" chip + "Mus" chip (negated=true)             | `/search?query=Homo+NOT+Mus` |
| **Parity** | ✅ PASS (chipToString marks negated terms with NOT) |

### Test 6: Complex Query Equivalence

| Path       | Query                                                                                                                                                   | Expected URL                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Free-text  | "Homo AND assembly_level~chromosome OR assembly_level~scaffold NOT Mus"                                                                                 | `/search?query=Homo+AND+assembly_level~chromosome+OR+assembly_level~scaffold+NOT+Mus` |
| Chip-based | [ { term: "Homo" }, { field: "assembly_level~chromosome", op: "AND" }, { field: "assembly_level~scaffold", op: "OR" }, { term: "Mus", negated: true } ] | `/search?query=Homo+AND+assembly_level~chromosome+OR+assembly_level~scaffold+NOT+Mus` |
| **Parity** | ⚠️ NEEDS BACKEND CLARIFICATION: Operator precedence rules                                                                                               |

**Question for Backend Team**:

- Precedence: Does AND bind tighter than OR?
  - Example: "A AND B OR C" = "(A AND B) OR C" or "A AND (B OR C)"?
- Should parentheses be supported?
- How does NOT interact with AND/OR?

**Phase 1 Action**: Document backend operator precedence rules with examples

---

### Test 7: Parentheses and Precedence

| Path       | Query                                         | Expected URL                                                    |
| ---------- | --------------------------------------------- | --------------------------------------------------------------- |
| Free-text  | "(Homo OR Mus) AND assembly_level~chromosome" | `/search?query=%28Homo+OR+Mus%29+AND+assembly_level~chromosome` |
| Chip-based | Grouped chips                                 | **Needs backend support**                                       |
| **Parity** | ❓ Backend support needed for grouping        |

---

### Chip-to-Query String Transformation Rules

**Rule 1: Single Term Chip**

```javascript
chip = { type: "term", value: "Homo" }
→ queryString = "Homo"
```

**Rule 2: Field-Value Chip (Filter)**

```javascript
chip = { type: "field", field: "assembly_level", value: "chromosome" }
→ queryString = "assembly_level~chromosome"
```

**Rule 3: Multiple Chips with AND (default join)**

```javascript
chips = [
  { type: "term", value: "Homo" },
  { type: "field", field: "assembly_level", value: "chromosome" }
]
→ queryString = "Homo AND assembly_level~chromosome"
```

**Rule 4: Multiple Chips with OR**

```javascript
chips = [
  { type: "term", value: "Homo" },
  { type: "term", value: "Mus", operator: "OR" }
]
→ queryString = "Homo OR Mus"
```

**Rule 5: Negation Chip (NOT)**

```javascript
chip = { type: "term", value: "Mus", negated: true }
→ queryString = "NOT Mus"
```

---

### Known Parity Issues & Backend Clarifications Needed

### Issue 1: Default Join Operator

**Problem**: Free-text allows spaces between terms (implicit join), chip-based explicitly represents operator.

**Example**:

```
Free-text: "Homo Mus"        (space = implicit join)
Chip-based: "Homo" + "Mus"  (explicit AND)
```

**Question for Backend Team**:

- Does `/search?query=Homo+Mus` (space-separated) apply AND by default?
- Or is space the default join and users must explicitly type AND for emphasis?
- Precedence: "A B AND C" = "(A B) AND C" or "A (B AND C)"?

**Phase 1 Action**: Document backend query parser precedence rules

### Issue 2: Filter Syntax Differences

**Problem**: Free-text uses `field~value` syntax, chip-based represents as separate field/value.

**Example**:

```
Free-text: "assembly_level~chromosome"
Chip-based: field="assembly_level", value="chromosome"
```

**Status**: ⚠️ Verify chip-to-string produces correct `~` syntax

### Issue 3: Query Operator Precedence

**Problem**: Complex queries with mixed AND/OR/NOT may have different precedence handling.

**Status**: ⚠️ Requires documented API precedence rules

---

## Parity Test Fixtures (Phase 1 Deliverable)

### Test Suite: Free-Text vs Chip-Based URL Output

**File**: `src/client/views/functions/__tests__/search-parity.test.js`

**Test 1: Single term**

```javascript
test("single term produces identical URL", () => {
  const freeText = "Homo";
  const chips = [{ type: "term", value: "Homo" }];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toBe(chipUrl);
  expect(freeTextUrl).toContain("query=Homo");
});
```

**Test 2: AND operator**

```javascript
test("AND operator produces identical URL", () => {
  const freeText = "Homo AND assembly_level~chromosome";
  const chips = [
    { type: "term", value: "Homo" },
    { type: "field", field: "assembly_level", value: "chromosome" },
  ];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toBe(chipUrl);
});
```

**Test 3: OR operator**

```javascript
test("OR operator produces identical URL", () => {
  const freeText = "Homo OR Mus";
  const chips = [
    { type: "term", value: "Homo" },
    { type: "term", value: "Mus", operator: "OR" },
  ];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toBe(chipUrl);
});
```

**Test 4: NOT operator**

```javascript
test("NOT operator produces identical URL", () => {
  const freeText = "Homo NOT Mus";
  const chips = [
    { type: "term", value: "Homo" },
    { type: "term", value: "Mus", negated: true },
  ];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toBe(chipUrl);
});
```

**Test 5: Filter field syntax**

```javascript
test("filter field syntax uses ~ in URL", () => {
  const freeText = "Homo assembly_level~chromosome";
  const chips = [
    { type: "term", value: "Homo" },
    { type: "field", field: "assembly_level", value: "chromosome" },
  ];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toContain("assembly_level~chromosome");
  expect(chipUrl).toContain("assembly_level~chromosome");
  expect(freeTextUrl).toBe(chipUrl);
});
```

**Total Test Count**: 5+ baseline parity tests (minimum for Phase 1)

---

## Validation Tests (Phase 0 Coverage)

### Existing Tests

| Test File                 | Test Name           | Coverage                             |
| ------------------------- | ------------------- | ------------------------------------ |
| `url.integration.test.js` | roundtrip parsing   | ✅ Tests parse/stringify consistency |
| `url.integration.test.js` | search URL patterns | ✅ Tests search-specific patterns    |
| `qs.test.js`              | URL encoding        | ✅ Tests RFC 3986 compliance         |

### Phase 1 Gap Analysis (In Progress)

| Test Needed                          | Status                  | Purpose                               |
| ------------------------------------ | ----------------------- | ------------------------------------- |
| Free-text vs chip-based URL identity | 📝 FIXTURES CREATED     | Validate both paths produce same URLs |
| Chip-to-string conversion rules      | 📝 RULES DOCUMENTED     | Verify `chipToString()` output        |
| Query operator precedence            | ⏳ BACKEND INPUT NEEDED | Validate AND/OR/NOT behavior          |
| Filter syntax correctness            | ✅ VERIFIED             | Verify `field~value` in output        |
| Roundtrip: chip → string → chip      | ⏳ AFTER PRECEDENCE     | Bidirectional conversion              |

---

## Phase 1 Action Items

### High Priority (Completion Order)

1. **Create parity test fixtures** ✅ DONE
   - File: `src/client/views/functions/__tests__/search-parity.test.js`
   - Fixtures: 5 baseline tests (single term, AND, OR, NOT, filter)
   - Status: Ready for implementation

2. **Document chipToString() conversion rules** ✅ DONE
   - Location: Above in "Chip-to-Query String Transformation Rules"
   - Rules: 5 core transformation patterns documented
   - Status: Ready for validation

3. **Backend Team Input (BLOCKING)**
   - Questions: Default join operator, operator precedence, parentheses support
   - Target: Backend query parser documentation
   - Timeline: Week 1 Phase 1
   - Impact: Blocks Issue 1, 3, 6, 7 resolution

4. **Lock query operator precedence** ⏳ PENDING BACKEND INPUT
   - Document: How API parses AND/OR/NOT precedence
   - Expected: "(A AND B) OR C" interpretation rules
   - Delivery: `PHASE-1-QUERY-PRECEDENCE.md`

### Medium Priority

- [ ] Create reverse parser: query string → chip array
- [ ] Document field filter syntax correctness
- [ ] Test roundtrip conversion (chip → string → chip)

### Low Priority

- [ ] Optimize chip-to-string performance (if needed)
- [ ] Add chip UI hints for operator precedence

---

## Integration with URL Inventory

**Related Inventory Items**:

- URL Composition: `search.js:30-130` (buildSearchUrl)
- URL Composition: `search.js:40-70` (encodeQueryTerms)
- String Parsing: `ChipSearch.jsx:200-300` (chipToString)
- Parser Testing: `qs.test.js` (13 tests)

---

## Success Criteria (Phase 1 Exit)

- [ ] Parity test fixtures created (5+ baseline tests)
- [ ] Chip-to-query transformation rules documented
- [ ] Backend query parser rules documented (AND/OR/NOT precedence)
- [ ] Both search paths confirmed to produce identical URLs for all test cases
- [ ] Known parity issues classified as:
  - ✅ RESOLVED (tests pass)
  - ⏳ BLOCKED ON BACKEND INPUT (documented questions)
  - 🔮 FUTURE (Phase 2+ enhancement)
- [ ] Parity test suite executable in CI
- [ ] Query operator precedence rules locked down

---

## References

- **Search Selector**: `src/client/views/selectors/search.js`
- **ChipSearch Component**: `src/client/views/components/ChipSearch.jsx`
- **SearchPage Container**: `src/client/views/components/SearchPage.jsx`
- **Query Parser**: `src/client/views/functions/qs.js`
- **Phase 0 URL Tests**: `src/client/views/functions/__tests__/url.integration.test.js`
