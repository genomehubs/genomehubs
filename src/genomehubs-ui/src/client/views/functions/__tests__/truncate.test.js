import { describe, expect, it } from "vitest";

import truncate from "../truncate";

describe("truncate utility", () => {
  describe("truncate from end (default)", () => {
    it("should truncate long strings from the end", () => {
      const longStr = "a".repeat(120);
      const result = truncate(longStr, 100);
      expect(result).toHaveLength(103); // 100 chars + '...'
      expect(result.slice(-3)).toBe("...");
    });

    it("should not truncate short strings", () => {
      const shortStr = "Hello World";
      const result = truncate(shortStr, 100);
      expect(result).toBe(shortStr);
    });

    it("should use default maxLen of 100", () => {
      const str = "x".repeat(120);
      const result = truncate(str);
      expect(result).toHaveLength(103); // 100 chars + '...'
    });

    it("should handle string exactly at maxLen", () => {
      const str = "x".repeat(100);
      const result = truncate(str, 100);
      expect(result).toBe(str); // No truncation
    });

    it("should handle string exactly at maxLen + 3", () => {
      const str = "x".repeat(103);
      const result = truncate(str, 100);
      expect(result).toBe(str); // Still no truncation (needs to be > maxLen + 3)
    });

    it("should handle string at maxLen + 4", () => {
      const str = "x".repeat(104);
      const result = truncate(str, 100);
      expect(result).toHaveLength(103); // Now it truncates
      expect(result.slice(-3)).toBe("...");
    });
  });

  describe("truncate from start (left=true)", () => {
    it("should truncate long strings from the start", () => {
      const longStr = "a".repeat(110);
      const result = truncate(longStr, 100, true);
      expect(result).toHaveLength(103); // 100 chars + '...'
      expect(result.charAt(0)).toBe(".");
      expect(result.charAt(1)).toBe(".");
      expect(result.charAt(2)).toBe(".");
    });

    it("should not truncate short strings from start", () => {
      const shortStr = "Hello World";
      const result = truncate(shortStr, 100, true);
      expect(result).toBe(shortStr);
    });

    it("should preserve end characters when truncating from left", () => {
      const str = "a".repeat(50) + "SPECIAL" + "b".repeat(60);
      const result = truncate(str, 100, true);
      expect(result).toContain("SPECIAL");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = truncate("", 100);
      expect(result).toBe("");
    });

    it("should handle single character", () => {
      const result = truncate("a", 100);
      expect(result).toBe("a");
    });

    it("should handle custom maxLen values", () => {
      const str = "x".repeat(50);
      const result = truncate(str, 10);
      expect(result).toHaveLength(13); // 10 + '...'
    });

    it("should handle maxLen of 0", () => {
      const str = "x".repeat(10);
      const result = truncate(str, 0);
      expect(result).toHaveLength(3); // just '...'
    });
  });
});
