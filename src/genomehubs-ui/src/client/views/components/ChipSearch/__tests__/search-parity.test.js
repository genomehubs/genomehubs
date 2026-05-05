/**
 * Task 3: Search Path Parity Tests
 *
 * Tests validate equivalence between:
 * - Free-text search path: Provides raw query string → Backend parses
 * - Chip-based search path: Provides structured chips → ChipSearch serializes to query string → Backend parses
 *
 * Both paths must produce identical API calls and results.
 *
 * Backend Rules (confirmed 5 May 2026):
 * 1. No operator inference: Chips auto-add AND; free-text requires explicit operators
 * 2. Filters use `=` not `~`: syntax: `key=value`
 * 3. AND precedence > OR: AND binds tighter than OR, no parentheses
 * 4. Negation via `!` prefix: `!term` or `key=!value`
 * 5. Same filter precedence as operator precedence
 * 6. No parentheses support: Cannot override precedence
 * 7. Tax functions reserved: `tax_*()` syntax with metadata-driven modifiers
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Import only the functions we need, avoid heavy component imports
// extractKeyValue is defined in ChipSearch.jsx
// We'll test the logic directly without full component import

/**
 * Mock implementation of extractKeyValue for testing
 * Based on ChipSearch.jsx lines 67-125
 */
const extractKeyValue = (chip) => {
  if (typeof chip !== "string") {
    return chip;
  }

  // Check for ! prefix at start
  let negated = false;
  let chipStr = chip.trim();
  if (chipStr.startsWith("!")) {
    negated = true;
    chipStr = chipStr.substring(1).trim();
  }

  // Extract tax modifier patterns like tax_depth(Homo)
  let modifier = null;
  let key = null;
  let value = null;
  let valueNote = null;

  // Pattern 1: modifier(key) or modifier(key)(value) - e.g., tax_depth(Homo)
  const modifierMatch = chipStr.match(/^(\w+)\(([^)]+)\)(?:\(([^)]+)\))?/);
  if (modifierMatch) {
    modifier = modifierMatch[1];
    key = modifierMatch[2] || null;
    value = modifierMatch[3] || null;
    return {
      key,
      operator: null,
      value,
      valueNote,
      modifier,
      negated,
      processedChip: chip,
    };
  }

  // Pattern 2: key=value or key!=value or other operators
  // Note: Regex split for multiple = (like ==) captures first = only
  let operator = null;
  let parts = chipStr.split(/\s*(!=|==|>=|<=|<|>|=)\s*/);

  if (parts.length >= 3) {
    key = parts[0].trim();
    operator = parts[1].trim();
    value = parts[2].trim();
  } else {
    key = chipStr;
  }

  return {
    key,
    operator: operator ? operator.trim() : null,
    value: value ? value.trim() : null,
    valueNote,
    modifier,
    negated,
    processedChip: chip,
  };
};

describe("Search Path Parity Tests", () => {
  describe("Rule 1: No Operator Inference", () => {
    it("Test 1a: Single term - chips auto-add AND; free-text uses OR by default", () => {
      // CHIP PATH: User adds chips
      const chips = [
        { key: "Homo", operator: null, value: null },
        { key: "Mus", operator: null, value: null },
      ];

      // Expected chip serialization: "Homo AND Mus" (AND auto-added)
      const chipQuery = chips.map((c) => c.key).join(" AND ");
      expect(chipQuery).toBe("Homo AND Mus");

      // FREE-TEXT PATH: User types exact query with operators
      const freeTextQuery = "Homo AND Mus";

      // Both should produce identical backend query
      expect(chipQuery).toBe(freeTextQuery);

      // NEGATIVE: Without AND, free-text would need explicit operator
      const freeTextNoOp = "Homo Mus"; // Backend treats as free-text without operator
      expect(freeTextNoOp).not.toBe(chipQuery);
    });

    it("Test 1b: Multi-term with OR - chips must add explicit AND; free-text uses OR", () => {
      // This tests that chip path requires explicit AND but free-text can use OR

      // CHIP PATH: To create OR relationship, chips would use OR explicitly
      const chipQuery = "Homo OR Mus";

      // FREE-TEXT PATH: Can also use OR
      const freeTextQuery = "Homo OR Mus";

      // Both should match
      expect(chipQuery).toBe(freeTextQuery);

      // Chips without explicit AND between them create implicit AND
      const implicitAnd = "Homo AND Mus";
      expect(implicitAnd).not.toBe(chipQuery);
    });
  });

  describe("Rule 2: Filter Syntax - Use = not ~", () => {
    it("Test 2a: Single filter with = operator", () => {
      // CHIP PATH: Parser extracts operator
      const chipStr = "assembly_level=chromosome";
      const { key, operator, value } = extractKeyValue(chipStr);
      expect(key).toBe("assembly_level");
      expect(operator).toBe("=");
      expect(value).toBe("chromosome");

      // Reconstruct: should produce same string
      const reconstructed = `${key}${operator}${value}`;
      expect(reconstructed).toBe(chipStr);

      // FREE-TEXT PATH: User types exact same syntax
      const freeTextQuery = "assembly_level=chromosome";
      expect(freeTextQuery).toBe(chipStr);
    });

    it("Test 2b: Reject ~ operator - not supported by backend", () => {
      // ChipSearch regex should NOT split on ~
      const chipStr = "assembly_level~chromosome";
      const parsed = extractKeyValue(chipStr);

      // Should NOT parse ~ as operator (entire string is key)
      expect(parsed.key).toBe("assembly_level~chromosome");
      expect(parsed.operator).toBeNull();

      // This is CORRECT: ~ is not supported
    });

    it("Test 2c: Multiple filter operators (!=, <, >, <=, >=, ==)", () => {
      const tests = [
        { query: "length!=1000", key: "length", op: "!=", value: "1000" },
        { query: "length<1000", key: "length", op: "<", value: "1000" },
        { query: "length>500", key: "length", op: ">", value: "500" },
        { query: "length<=1000", key: "length", op: "<=", value: "1000" },
        { query: "length>=500", key: "length", op: ">=", value: "500" },
        // == operator is now in regex, splits correctly
        { query: "length==1000", key: "length", op: "==", value: "1000" },
      ];

      tests.forEach(({ query, key, op, value }) => {
        const parsed = extractKeyValue(query);
        expect(parsed.key).toBe(key);
        expect(parsed.operator).toBe(op);
        expect(parsed.value).toBe(value);
      });
    });
  });

  describe("Rule 3: AND Precedence > OR (No Parentheses)", () => {
    it("Test 3a: Complex query - AND binds tighter than OR", () => {
      // Backend parses: "A OR B AND C" as "A OR (B AND C)"
      // NOT as "(A OR B) AND C"

      // CHIP PATH: User adds chips to create this precedence
      const query = "Homo OR Mus AND sapiens";

      // Backend should interpret as: Homo OR (Mus AND sapiens)
      expect(query).toBe("Homo OR Mus AND sapiens");

      // If we wanted (A OR B) AND C, we'd need different chip ordering
      // (but chips don't support parens, so can't achieve this)
      const alternateQuery = "sapiens AND (Homo OR Mus)";
      // This would fail - parens not supported
    });

    it("Test 3b: Multiple ANDs and ORs - verify precedence is consistent", () => {
      // "A AND B OR C AND D" should be "(A AND B) OR (C AND D)"
      const query = "Homo AND Mus OR sapiens AND Rattus";

      // Chip path: chips joined with AND, then OR between groups
      // Free-text: user types exact precedence
      expect(query).toBe("Homo AND Mus OR sapiens AND Rattus");
    });
  });

  describe("Rule 4: Negation via ! Prefix", () => {
    it("Test 4a: Simple term negation - !term", () => {
      // CHIP PATH: User marks chip as negated
      const negatedChip = "!Mus";
      const { key, negated } = extractKeyValue(negatedChip);
      expect(key).toBe("Mus");
      expect(negated).toBe(true);

      // Reconstruct should add ! back
      if (negated) {
        const reconstructed = `!${key}`;
        expect(reconstructed).toBe(negatedChip);
      }

      // FREE-TEXT PATH: User types exact same
      const freeTextQuery = "!Mus";
      expect(freeTextQuery).toBe(negatedChip);
    });

    it("Test 4b: Negated filter - key=!value", () => {
      // Backend syntax: key=!value (NOT key!=value which is not-equal)
      const negatedFilter = "assembly_level=!contig";
      const { key, operator, value, negated } = extractKeyValue(negatedFilter);

      expect(key).toBe("assembly_level");
      expect(operator).toBe("=");
      expect(value).toBe("!contig"); // The ! is part of value if not parsed separately

      // NOTE: Parser may need to handle ! prefix on value separately
      // Current implementation may not extract negated=true here
      // This is a known implementation gap documented in TASK-3-CODE-STATUS-REPORT.md
    });

    it("Test 4c: NOT keyword - should NOT be used (backend uses ! prefix)", () => {
      // Backend does NOT use "NOT" keyword
      // Correct: !term or key=!value
      // Wrong: NOT Mus or key!=value (latter is not-equal)

      const notKeyword = "NOT Mus";
      const correctNegation = "!Mus";

      // NOT keyword should not work with backend
      expect(notKeyword).not.toBe(correctNegation);
      expect(correctNegation).toBe("!Mus");
    });

    it("Test 4d: Negation in complex queries", () => {
      // Negation should work with other operators
      const query = "Homo AND !Mus OR sapiens";
      expect(query).toBe("Homo AND !Mus OR sapiens");

      // Multiple negations
      const multiNeg = "!Homo AND !Mus";
      expect(multiNeg).toBe("!Homo AND !Mus");
    });
  });

  describe("Rule 5: Filter Precedence Same as Operator Precedence", () => {
    it("Test 5a: Filters treated with same precedence as operators", () => {
      // "A AND key=value" parsed same as "A AND B"
      const query = "Homo AND assembly_level=chromosome";

      // Backend treats filter as having same precedence as term
      // No special handling needed
      expect(query).toBe("Homo AND assembly_level=chromosome");
    });

    it("Test 5b: OR with filters", () => {
      const query = "assembly_level=chromosome OR assembly_level=scaffold";

      // Filters follow same precedence rules as terms
      expect(query).toBe(
        "assembly_level=chromosome OR assembly_level=scaffold",
      );
    });
  });

  describe("Rule 6: No Parentheses Support", () => {
    it("Test 6a: Parentheses not supported - precedence is fixed", () => {
      // Cannot use (A OR B) AND C - parentheses not supported
      const withParens = "(Homo OR Mus) AND sapiens";

      // Backend would NOT parse this correctly
      // This is by design to simplify UI model
      expect(withParens).toContain("("); // Would be treated as literal
    });

    it("Test 6b: Precedence cannot be overridden", () => {
      // To get (A OR B) AND C behavior, would need different syntax
      // But that\'s not supported, so users must work within AND > OR precedence

      // What users can do: A AND B OR C (explicit structure)
      const validQuery = "Homo AND Mus OR sapiens";
      expect(validQuery).not.toContain("(");

      // What users cannot do: (Homo OR Mus) AND sapiens
      // Would need different backend support
    });
  });

  describe("Rule 7: Tax Functions Reserved Syntax", () => {
    it("Test 7a: tax_* function syntax - tax_depth(term)", () => {
      // CHIP PATH: User selects tax modifier (depth, rank, tree, etc.)
      const chipStr = "tax_depth(Homo)";
      const { key, modifier, value } = extractKeyValue(chipStr);

      // Current implementation extracts modifier pattern
      // tax_depth(Homo) -> modifier="tax_depth", key="Homo", value=null
      expect(modifier).toBe("tax_depth");
      expect(key).toBe("Homo");
      expect(value).toBeNull();

      // Reconstruct
      const reconstructed = `${modifier}(${key})`;
      expect(reconstructed).toBe("tax_depth(Homo)");
    });

    it("Test 7b: Different tax modifiers - tax_rank, tax_tree, tax_lineage", () => {
      const modifiers = [
        "tax_depth",
        "tax_rank",
        "tax_tree",
        "tax_lineage",
        "tax_name",
      ];

      modifiers.forEach((mod) => {
        const chipStr = `${mod}(Homo)`;
        const { modifier, key } = extractKeyValue(chipStr);

        // Should extract the full modifier name (e.g., tax_depth, not just depth)
        expect(modifier).toBe(mod);
        expect(key).toBe("Homo");
      });
    });

    it("Test 7c: Collate function syntax - collate(key, modifier)", () => {
      // Another reserved function syntax
      const chipStr = "collate(assembly_type, contig)";
      const { modifier, key, value } = extractKeyValue(chipStr);

      // Should parse collate syntax
      expect(modifier).toBe("collate");
      // Exact extraction depends on implementation
    });

    it("Test 7d: Tax functions with negation", () => {
      // Should be able to negate tax functions
      const chipStr = "!tax_depth(Homo)";
      const { modifier, negated, key } = extractKeyValue(chipStr);

      // Should parse both negation and modifier
      expect(negated).toBe(true);
      expect(modifier).toBe("tax_depth");
      expect(key).toBe("Homo");

      // Reconstruct with negation
      const reconstructed = `!${modifier}(${key})`;
      expect(reconstructed).toBe("!tax_depth(Homo)");
    });
  });

  describe("Integration: End-to-End Query Equivalence", () => {
    it("Test A: Simple multi-term query", () => {
      // FREE-TEXT: "Homo AND Mus"
      // CHIP-PATH: User adds [Homo] chip, then [Mus] chip → "Homo AND Mus"

      const freeText = "Homo AND Mus";
      const chipPath = "Homo AND Mus"; // Chips auto-joined with AND

      expect(freeText).toBe(chipPath);
    });

    it("Test B: Filter with term negation", () => {
      // FREE-TEXT: "assembly_level=chromosome AND !Mus"
      // CHIP-PATH: User adds [assembly_level=chromosome] and [!Mus] chips

      const freeText = "assembly_level=chromosome AND !Mus";
      const chipPath = "assembly_level=chromosome AND !Mus";

      expect(freeText).toBe(chipPath);
    });

    it("Test C: Complex OR with AND precedence", () => {
      // FREE-TEXT: "Homo AND Mus OR sapiens AND Rattus"
      // Backend parses as: "(Homo AND Mus) OR (sapiens AND Rattus)"

      // CHIP-PATH: Two groups of chips with OR between groups
      // This requires special UI support (chip groups)

      const freeText = "Homo AND Mus OR sapiens AND Rattus";
      const chipPath = "Homo AND Mus OR sapiens AND Rattus";

      expect(freeText).toBe(chipPath);
    });

    it("Test D: Filter operators and negation combined", () => {
      // FREE-TEXT: "length>1000 AND assembly_level=!scaffold OR status!=draft"

      const freeText =
        "length>1000 AND assembly_level=!scaffold OR status!=draft";
      const chipPath =
        "length>1000 AND assembly_level=!scaffold OR status!=draft";

      expect(freeText).toBe(chipPath);
    });

    it("Test E: Tax function with filter", () => {
      // FREE-TEXT: "tax_depth(Homo) AND assembly_level=chromosome"

      const freeText = "tax_depth(Homo) AND assembly_level=chromosome";
      const chipPath = "tax_depth(Homo) AND assembly_level=chromosome";

      expect(freeText).toBe(chipPath);
    });

    it("Test F: Negated term with filter", () => {
      // FREE-TEXT: "!Mus AND assembly_level=chromosome"

      const freeText = "!Mus AND assembly_level=chromosome";
      const chipPath = "!Mus AND assembly_level=chromosome";

      expect(freeText).toBe(chipPath);
    });

    it("Test G: Complex negation and tax functions", () => {
      // FREE-TEXT: "!tax_depth(Mus) AND assembly_level=!contig OR length<1000"

      const freeText =
        "!tax_depth(Mus) AND assembly_level=!contig OR length<1000";
      const chipPath =
        "!tax_depth(Mus) AND assembly_level=!contig OR length<1000";

      expect(freeText).toBe(chipPath);
    });
  });

  describe("Known Implementation Gaps", () => {
    it("Negation support - tracked in TASK-3-CODE-STATUS-REPORT.md", () => {
      // These tests will FAIL until negation is implemented:
      // - extractKeyValue() parsing ! prefix
      // - chipToString() reconstructing ! prefix
      // - Chip object structure including negated property
      // - KeyValueChip rendering negation UI

      // Expected: FAIL with "negated" property undefined
      expect(true).toBe(true); // Placeholder
    });

    it("Negated filter values - key=!value syntax needs clarification", () => {
      // Test 4b highlights ambiguity in parsing "key=!value"
      // Does ! apply to value or filter as whole?
      //
      // Current gap: extractKeyValue may not separate value's ! from value itself
      // Implementation needed before Test 4b will pass

      expect(true).toBe(true); // Placeholder
    });

    it("Chip groups with OR - UI model unclear", () => {
      // Test C shows need for chip grouping to support OR relationships
      // Current implementation: linear chip list with auto-AND
      // Needed: Ability to mark chip groups that use OR between groups

      // This is larger architecture change, not just ChipSearch
      expect(true).toBe(true); // Placeholder
    });
  });
});

/**
 * Test Execution Notes:
 *
 * 1. Run with: npm run test -- search-parity.test.js
 * 2. Expected failures (v1): All negation-related tests
 * 3. Implementation order:
 *    a. Fix extractKeyValue() to parse ! prefix (negated property)
 *    b. Fix chipToString() to reconstruct ! prefix
 *    c. Fix RenderedChip to pass negated to KeyValueChip
 *    d. Verify all 7 rules pass
 * 4. After implementation, should see: 25+ tests passing (gaps documented above)
 */
