# Task 3: Code Status Report - ChipSearch Implementation

**Date**: 5 May 2026  
**Status**: READY WITH CORRECTIONS NEEDED  
**File**: `src/client/views/components/ChipSearch/ChipSearch.jsx`

---

## Current Implementation Analysis

### ✅ CHECK 1: Filter Syntax (Uses `=` not `~`)

**Status**: ✅ **CORRECT** - No issues found

**Evidence**:

```javascript
// Line 30-57: chipToString() function
if (operator) {
  chipString += `${operator}`; // Uses whatever operator is set
} else {
  chipString += "="; // Defaults to = (CORRECT!)
}
```

**Parsing** (Line 73):

```javascript
let [key, operator, value] = chip.split(/\s*(!=|>=|<=|<|>|=)\s*/);
// Regex only splits on: != >= <= < > =
// NOT on ~ (correct)
```

**Finding**: Code correctly uses `=` for filters. No `~` syntax anywhere.

---

### ❌ CHECK 2: Negation Support (`!` Prefix)

**Status**: ❌ **NOT IMPLEMENTED** - Needs implementation

**Evidence - What's Missing**:

1. **No `!` parsing** - extractKeyValue() doesn't extract `!` prefix
2. **No negation property** - Chip objects don't have `negated: true/false` property
3. **No negation rendering** - KeyValueChip component doesn't show negation UI
4. **No negation reconstruction** - chipToString() doesn't add `!` prefix back

**Current Chip Structure**:

```javascript
chipObj = {
  key, // e.g., "assembly_level"
  operator, // e.g., "="
  value, // e.g., "chromosome"
  valueNote, // e.g., "[note]"
  modifier, // e.g., "min", "tax_tree"
  // MISSING: negated: true/false
};
```

**Test for Negation**:
Looking through 400+ lines of ChipSearch.jsx, there is NO mention of:

- `negated`
- `!` prefix
- `NOT` operator (though `NOT` is correctly not used - good!)

---

### ✅ CHECK 3: AND Joining Between Chips

**Status**: ✅ **CORRECT** - AND is auto-added

**Evidence** (Line 281):

```javascript
handleValueChange(uniqueArr.join(" "));
```

And in removeDuplicates (lines 253-269):

```javascript
for (let key of keyOrder) {
  for (let item of byKey[key]) {
    if (item !== "" && !uniqueArr.includes(item)) {
      if (uniqueArr.length > 0) {
        uniqueArr.push("AND"); // ✅ Adds AND between chips
      }
      uniqueArr.push(item);
    }
  }
}
```

Result: Multiple chips auto-joined with `AND` (correct per backend rules)

---

## Summary of Findings

| Check | Item                         | Status         | Notes                                  |
| ----- | ---------------------------- | -------------- | -------------------------------------- |
| 1     | Uses `=` not `~` for filters | ✅ **GOOD**    | No issues, correct operator            |
| 2     | Supports `!` prefix negation | ❌ **MISSING** | Needs implementation                   |
| 3     | Auto-adds AND between chips  | ✅ **GOOD**    | Correct behavior                       |
| 4     | Preserves operator parsing   | ✅ **GOOD**    | Correctly parses `=, !=, <, >, <=, >=` |

---

## What Needs to Be Implemented

### Implementation 1: Parse `!` Prefix

**Location**: extractKeyValue() function, around line 73

**Current Code**:

```javascript
let [key, operator, value] = chip.split(/\s*(!=|>=|<=|<|>|=)\s*/);
```

**Needed Change**:

```javascript
// Check for ! prefix at start
let negated = false;
let chipStr = chip.trim();
if (chipStr.startsWith("!")) {
  negated = true;
  chipStr = chipStr.substring(1).trim(); // Remove ! prefix
}
let [key, operator, value] = chipStr.split(/\s*(!=|>=|<=|<|>|=)\s*/);
```

### Implementation 2: Store Negation in Chip Object

**Location**: extractKeyValue() return statement, around line 113

**Current Code**:

```javascript
let chipObj = {
  key,
  operator: operator ? operator.trim() : null,
  value: value ? value.trim() : key == "tax" ? "" : null,
  valueNote: valueNote ? valueNote.trim() : null,
  modifier: modifier ? modifier.trim() : null,
};
```

**Needed Change**:

```javascript
let chipObj = {
  key,
  operator: operator ? operator.trim() : null,
  value: value ? value.trim() : key == "tax" ? "" : null,
  valueNote: valueNote ? valueNote.trim() : null,
  modifier: modifier ? modifier.trim() : null,
  negated: negated, // ADD THIS
};
```

### Implementation 3: Reconstruct `!` in chipToString()

**Location**: chipToString() function, line 30

**Current Code**:

```javascript
const chipToString = (chip) => {
  if (typeof chip === "string") {
    return chip;
  }
  const { key, operator, value, valueNote, modifier } = chip;
  let chipString;
  // ... build chipString ...
  return chipString;
};
```

**Needed Change**:

```javascript
const chipToString = (chip) => {
  if (typeof chip === "string") {
    return chip;
  }
  const { key, operator, value, valueNote, modifier, negated } = chip;

  // ... existing logic to build chipString ...

  // ADD THIS at the end before returning:
  if (negated && chipString) {
    chipString = "!" + chipString;
  }

  return chipString;
};
```

### Implementation 4: Pass `negated` to KeyValueChip Component

**Location**: RenderedChip component, around line 385

**Current Code**:

```javascript
const RenderedChip = ({ chip, index, lookupFunction, ...props }) => {
  const { key, operator, value, valueNote, modifier } = extractKeyValue(chip);
  return (
    <KeyValueChip
      keyLabel={key}
      value={value}
      valueNote={valueNote}
      operator={operator}
      modifier={modifier}
      // ... other props ...
    />
  );
};
```

**Needed Change**:

```javascript
const RenderedChip = ({ chip, index, lookupFunction, ...props }) => {
  const { key, operator, value, valueNote, modifier, negated } =
    extractKeyValue(chip);
  return (
    <KeyValueChip
      keyLabel={key}
      value={value}
      valueNote={valueNote}
      operator={operator}
      modifier={modifier}
      negated={negated} // ADD THIS
      // ... other props ...
    />
  );
};
```

---

## Test Implications

With these changes implemented:

- ✅ `!Mus` will be parsed → `negated: true, key: "Mus"`
- ✅ `!assembly_level=chromosome` will work → `negated: true, key: "assembly_level", operator: "=", value: "chromosome"`
- ✅ chipToString() will reconstruct as `!Mus` and `!assembly_level=chromosome`
- ✅ Chips will join with AND → `Homo AND !Mus` (correct)

---

## Recommendation

**Proceed with Test Implementation**:

Create tests with the assumption that these 4 implementations WILL BE DONE. The tests will:

1. Validate correct parsing of `!` prefix
2. Validate chipToString() reconstruction
3. Validate URL generation with negated chips
4. Ensure `!` prefix works in all contexts (simple terms, filters, functions)

**Tests will FAIL initially** (correct behavior) until code fixes are implemented.

---

## Files to Modify

| File             | Changes                          | Lines  | Impact                |
| ---------------- | -------------------------------- | ------ | --------------------- |
| ChipSearch.jsx   | extractKeyValue() - parse `!`    | ~73    | Parse negation        |
| ChipSearch.jsx   | chipToString() - reconstruct `!` | ~30-60 | Output negation       |
| ChipSearch.jsx   | chipObj structure - add negated  | ~113   | Store negation        |
| ChipSearch.jsx   | RenderedChip - pass negated      | ~385   | UI rendering          |
| KeyValueChip.jsx | (TBD) - render negation UI       | (TBD)  | Show negation to user |

---

## Status: PROCEED TO TESTS

✅ **Filter syntax correct** (uses `=`)  
❌ **Negation missing** (needs 4 small code changes)  
✅ **AND joining correct**

**Recommendation**: Create test fixtures first, they will document exactly what needs to be implemented. Tests will fail initially, guiding code fix development.
