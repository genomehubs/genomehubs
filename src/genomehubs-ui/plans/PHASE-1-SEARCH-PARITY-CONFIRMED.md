# Phase 1: Search Path Parity - Backend Rules Confirmed

**Status**: Phase 1 - Baseline & Controls  
**Last Updated**: May 2026  
**Backend Answers**: CONFIRMED ✅

---

## Backend Query Parser Rules (LOCKED DOWN)

### Rule 1: No Operator Inference

**Status**: ✅ CONFIRMED

**Definition**:

- Text input is treated as a **single term** unless operators are explicitly typed
- Operators are NEVER inferred from spacing or context
- ChipSearch automatically fills in `AND` operators between chips
- Free-text search requires users to explicitly type operators (AND, OR)

**Examples**:

```
Free-text: "Homo Mus"
→ Single term search for "Homo Mus" (not AND)

Free-text: "Homo AND Mus"
→ Two terms connected by AND

ChipSearch: "Homo" chip + "Mus" chip
→ Auto-generates: "Homo AND Mus"
```

**Impact**: Free-text and chip-based paths **differ in behavior** - chips add AND, text doesn't.

- **Solution**: ACCEPT this difference. Don't force them to be identical URLs.
- Chips are UI convenience layer that auto-adds operators

---

### Rule 2: Filter Syntax Uses `=` (Not `~`)

**Status**: ✅ CONFIRMED

**Definition**:

- Filter syntax: `field=value` (equals)
- Supported operators: `=`, `!=`, `<`, `<=`, `>`, `>=`
- `~` is NOT valid in filter syntax (was documentation error)
- URL generation handled by SDK query builder (UI doesn't need to know escaping rules)

**Examples**:

```
Valid: "assembly_level=chromosome"
Valid: "assembly_span>=1000000"
Valid: "assembly_level!=contig"
Invalid: "assembly_level~chromosome"  (NOT valid)
```

**URL Encoding**: SDK query builder handles URL encoding, UI just passes query string

**Impact**: Correct chipToString() to use `=` instead of `~`

---

### Rule 3: AND Binds Tighter Than OR

**Status**: ✅ CONFIRMED

**Definition**:

- AND has higher precedence than OR (standard boolean logic)
- Example: `A OR B AND C` → `A OR (B AND C)`
- **Parentheses NOT supported** (no way to override precedence)

**Examples**:

```
"Homo AND assembly_level=chromosome OR Mus"
→ Parsed as: (Homo AND assembly_level=chromosome) OR Mus
→ Matches: (Homo with chromosome) OR (Mus with any assembly_level)

"Homo OR Mus AND assembly_level=chromosome"
→ Parsed as: Homo OR (Mus AND assembly_level=chromosome)
→ Matches: Homo (any level) OR (Mus with chromosome)
```

**Impact**: Test fixtures must use standard AND-before-OR precedence

---

### Rule 4: NOT Uses `!` Prefix (Not Supported as Operator)

**Status**: ✅ CONFIRMED

**Definition**:

- `NOT` as standalone operator is NOT supported
- Negation achieved via `!` prefix on items
- Works with: taxonomy names, keywords, list items
- Examples: `!Mus`, `assembly_level=chromosome,!contig`

**Examples**:

```
Supported: "Homo AND !Mus"
→ Homo but exclude Mus

Supported: "tax_tree(Homo,!Mus,Rattus)"
→ Homo and Rattus subtrees, exclude Mus

Supported: "assembly_level=chromosome,!contig"
→ assembly_level is chromosome but not contig

Not supported: "Homo NOT Mus"
→ NOT operator doesn't exist
```

**Impact**:

- Chip-based search needs checkbox or toggle for negation
- Free-text users type `!` prefix manually
- Test cases should use `!` not `NOT`

---

### Rule 5: Filter Precedence Same as General Operators

**Status**: ✅ CONFIRMED

**Definition**: Filters follow same AND-before-OR precedence as terms

**Examples**:

```
"assembly_level=chromosome AND Homo OR Mus"
→ (assembly_level=chromosome AND Homo) OR Mus

"Homo OR assembly_level=chromosome AND Mus"
→ Homo OR (assembly_level=chromosome AND Mus)
```

**Impact**: Consistent precedence rules everywhere

---

### Rule 6: Parentheses NOT Supported

**Status**: ✅ CONFIRMED

**Definition**: No parentheses for grouping/overriding precedence

**Examples**:

```
Not valid: "(Homo OR Mus) AND assembly_level=chromosome"
```

**Workaround**: Use standard precedence (AND before OR)

**Impact**: Chip UI doesn't need to support grouping/bracketing

---

### Rule 7: Tax Functions (`tax_*()`) Are Special Syntax

**Status**: ✅ CONFIRMED

**Definition**:

- `tax_*()` functions are reserved for taxonomy filtering
- Modifiers supported by some attributes (defined in metadata)
- Examples: `tax_tree()`, `tax_name()`, `min()`, `max()`

**Examples**:

```
"tax_tree(Homo)"
→ Include Homo and its taxonomic subtree

"tax_name(Homo)"
→ Include only exact Homo name

"min(assembly_span)=654321"
→ assembly_span minimum is 654321

"max(genome_size)=3000000"
→ genome_size maximum is 3M
```

**Impact**:

- Modifiers handled by metadata-driven UI
- SDK validates which modifiers are available per attribute
- No need to hardcode modifier rules

---

## Corrected Test Fixtures

### Test 1: Single Term (No Operator)

```javascript
test("single term search: text vs chips differ by design", () => {
  // Free-text: User must type exactly what they want
  const freeText = "Homo";
  expect(buildSearchUrl({ query: freeText })).toContain("query=Homo");

  // Chip-based: Chips auto-add AND between them
  const chips = [{ key: "Homo" }];
  expect(chipToString(chips)).toBe("Homo"); // Single chip = just the term
});
```

**Key insight**: Single chip ≠ auto-add AND. AND only added between multiple chips.

---

### Test 2: AND Operator (Explicit in Free-Text)

```javascript
test("AND operator: both paths produce identical URL", () => {
  const freeText = "Homo AND assembly_level=chromosome";
  const chips = [
    { key: "Homo" },
    { key: "assembly_level", operator: "=", value: "chromosome" },
  ];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toBe(chipUrl);
  expect(freeTextUrl).toContain("query=Homo+AND+assembly_level%3Dchromosome");
});
```

**Key**: Filter uses `=` (not `~`), URL-encoded as `%3D`

---

### Test 3: OR Operator

```javascript
test("OR operator: both paths produce identical URL", () => {
  const freeText = "Homo OR Mus";
  const chips = [{ key: "Homo", operator: "OR" }, { key: "Mus" }];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toBe(chipUrl);
  expect(freeTextUrl).toContain("query=Homo+OR+Mus");
});
```

---

### Test 4: Negation with `!`

```javascript
test("negation uses ! prefix", () => {
  const freeText = "Homo AND !Mus";
  const chips = [{ key: "Homo" }, { key: "Mus", negated: true }];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toBe(chipUrl);
  expect(freeTextUrl).toContain("query=Homo+AND+%21Mus"); // ! encoded as %21
});
```

---

### Test 5: AND Before OR (Precedence)

```javascript
test("AND binds tighter than OR", () => {
  const freeText = "Homo AND assembly_level=chromosome OR Mus";
  const chips = [
    { key: "Homo" },
    { key: "assembly_level", operator: "=", value: "chromosome" },
    { key: "Mus", operator: "OR" },
  ];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toBe(chipUrl);
  // Should parse as: (Homo AND assembly_level=chromosome) OR Mus
});
```

---

### Test 6: Tax Functions

```javascript
test("tax functions use reserved syntax", () => {
  const freeText = "tax_tree(Homo)";
  const chips = [
    { key: "Homo", modifier: "tax_tree" }, // Or however chips represent this
  ];

  const freeTextUrl = buildSearchUrl({ query: freeText });
  const chipUrl = buildSearchUrl({ query: chipToString(chips) });

  expect(freeTextUrl).toBe(chipUrl);
  expect(freeTextUrl).toContain("tax_tree%28Homo%29"); // Parens encoded as %28 %29
});
```

---

### Test 7: Negation in Tax Functions

```javascript
test("negation works inside tax function lists", () => {
  const freeText = "tax_tree(Homo,!Mus,Rattus)";

  // Chip representation might be an array of items with negation flags
  const chips = [
    {
      key: "tax_tree",
      value: [
        { name: "Homo" },
        { name: "Mus", negated: true },
        { name: "Rattus" },
      ],
    },
  ];

  expect(buildSearchUrl({ query: freeText })).toContain(
    "tax_tree%28Homo%2C%21Mus%2CRattus%29",
  ); // Commas as %2C
});
```

---

## Impact on chipToString()

**Current Implementation Issue**:

- Uses `~` in filter syntax (should be `=`)
- Defaults to `AND` join (CORRECT for multi-chip behavior)
- Doesn't support `!` prefix (needs implementation)
- May not handle tax functions correctly

**Corrections Needed**:

1. Change `~` to `=` in filter syntax
2. Add `!` prefix when `negated: true`
3. Handle tax function syntax
4. Ensure modifiers are applied correctly

**Example Update**:

```javascript
// BEFORE (incorrect)
if (chip.field && chip.value) {
  return `${chip.field}~${chip.value}`; // Wrong operator
}

// AFTER (correct)
if (chip.field && chip.value) {
  const op = chip.operator || "="; // Default to =
  return `${chip.field}${op}${chip.value}`;
}

// BEFORE (no negation)
const result = chipToString(chip);

// AFTER (with negation)
const prefix = chip.negated ? "!" : "";
const result = prefix + chipToString(chip);
```

---

## Phase 1 Task 3: Ready to Implement

### Test Suite File

`src/client/views/functions/__tests__/search-parity.test.js`

### Test Cases (7 Core Tests)

1. ✅ Single term (no operator inference)
2. ✅ AND operator (explicit required)
3. ✅ OR operator (with AND precedence)
4. ✅ Negation with `!` prefix
5. ✅ AND before OR precedence
6. ✅ Tax functions with reserved syntax
7. ✅ Negation inside tax functions

### Validation

- [ ] All tests passing
- [ ] Both free-text and chip paths produce identical URLs for all test cases
- [ ] Filter syntax uses `=` not `~`
- [ ] Negation uses `!` not `NOT`
- [ ] Precedence: AND > OR
- [ ] Tax functions handled correctly

### Blocker Resolution

✅ **NO LONGER BLOCKED** - All 7 backend questions answered

---

## Implementation Priority

### Phase 1 (This Week)

- [x] Receive backend answers ✅ DONE
- [ ] Create corrected test fixtures (7 tests)
- [ ] Implement tests in CI
- [ ] Run parity validation
- [ ] Update PHASE-1-SEARCH-PARITY.md with confirmed rules

### Phase 2 (URL Builders)

- Implement `chipToString()` corrections with test coverage
- Create SDK query builder adapter (will handle all syntax rules)
- Add validation and error handling

---

## References

- **ChipSearch**: `src/client/views/components/ChipSearch/ChipSearch.jsx`
- **Query Parser**: `src/client/views/selectors/search.js`
- **Current Tests**: `src/client/views/functions/__tests__/url.integration.test.js`
- **Filter Syntax**: Uses `=`, `!=`, `<`, `<=`, `>`, `>=` (confirmed)
- **Negation**: Uses `!` prefix, not `NOT` operator (confirmed)
- **Precedence**: AND > OR, no parentheses support (confirmed)
- **Tax Functions**: Reserved syntax `tax_*()` with modifiers (confirmed)
