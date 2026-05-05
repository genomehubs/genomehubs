import { describe, expect, it } from "vitest";

import qs from "../../functions/qs";

/**
 * Integration tests for URL query string handling
 * Tests parsing and building URLs for search, reports, and navigation
 * These tests are critical for Phase 3 (URL compat layer) and Phase 4 (URL consolidation)
 */
describe("URL query string integration", () => {
  describe("search URL patterns", () => {
    it("should handle basic search URL", () => {
      const url = "query=Homo&result=taxon&taxonomy=ncbi";
      const parsed = qs.parse(url);

      expect(parsed.query).toBe("Homo");
      expect(parsed.result).toBe("taxon");
      expect(parsed.taxonomy).toBe("ncbi");

      // Rebuild should be equivalent
      const rebuilt = qs.stringify(parsed);
      const reparsed = qs.parse(rebuilt);
      expect(reparsed).toEqual(parsed);
    });

    it("should handle complex search with operators", () => {
      const url =
        "query=tax_name(Homo)%20AND%20assembly_type~reference&result=assembly";
      const parsed = qs.parse(url);

      expect(parsed.query).toContain("tax_name");
      expect(parsed.query).toContain("AND");
      expect(parsed.result).toBe("assembly");
    });

    it("should handle search with multiple filters", () => {
      const params = {
        query: "Homo",
        result: "assembly",
        assembly_type: "reference genome",
        assembly_level: "complete",
      };

      const url = qs.stringify(params);
      const parsed = qs.parse(url);

      expect(parsed.query).toBe("Homo");
      expect(parsed.assembly_type).toBe("reference genome");
      expect(parsed.assembly_level).toBe("complete");
    });

    it("should preserve array parameters in filters", () => {
      const params = {
        query: "test",
        result: "file",
        file_type: ["fasta", "gff3", "agp"],
      };

      const url = qs.stringify(params);
      const parsed = qs.parse(url);

      expect(Array.isArray(parsed.file_type)).toBe(true);
      expect(parsed.file_type).toContain("fasta");
    });
  });

  describe("report URL patterns", () => {
    it("should handle report URL with query terms", () => {
      const url = "query=Homo&result=taxon&report=tree&treeThreshold=5";
      const parsed = qs.parse(url);

      expect(parsed.query).toBe("Homo");
      expect(parsed.report).toBe("tree");
      expect(parsed.treeThreshold).toBe("5");
    });

    it("should handle report with multiple parameters", () => {
      const params = {
        query: "Homo",
        result: "taxon",
        report: "histogram",
        countGenomes: "true",
        treeThreshold: "10",
        mapThreshold: "15",
      };

      const url = qs.stringify(params);
      const parsed = qs.parse(url);

      expect(parsed.report).toBe("histogram");
      expect(parsed.countGenomes).toBe("true");
      expect(parseInt(parsed.treeThreshold)).toBe(10);
    });

    it("should handle report edit parameters", () => {
      const params = {
        query: "Homo",
        report: "tree",
        reportEdit: "true",
        highlightColor: "red",
        includeEstimates: "false",
      };

      const url = qs.stringify(params);
      const parsed = qs.parse(url);

      expect(parsed.reportEdit).toBe("true");
      expect(parsed.highlightColor).toBe("red");
    });
  });

  describe("legacy URL compatibility", () => {
    it("should parse URLs with URL-encoded spaces", () => {
      const url = "query=Homo%20sapiens&result=assembly";
      const parsed = qs.parse(url);

      expect(parsed.query).toBe("Homo sapiens");
    });

    it("should handle URLs with + for spaces", () => {
      // Some systems use + for space encoding
      const params = { query: "Homo sapiens" };
      const url = qs.stringify(params);
      const parsed = qs.parse(url);

      expect(parsed.query).toBe("Homo sapiens");
    });

    it("should handle old pagination parameters", () => {
      const url = "query=test&result=assembly&from=0&size=20";
      const parsed = qs.parse(url);

      expect(parsed.from).toBe("0");
      expect(parsed.size).toBe("20");
    });

    it("should handle old sort parameters", () => {
      const url = "query=test&result=assembly&sort=name.keyword&order=asc";
      const parsed = qs.parse(url);

      expect(parsed.sort).toBe("name.keyword");
      expect(parsed.order).toBe("asc");
    });
  });

  describe("URL edge cases", () => {
    it("should handle empty query strings", () => {
      const parsed = qs.parse("");
      expect(parsed).toEqual({});
    });

    it("should handle URLs with only query parameter", () => {
      const url = "query=test";
      const parsed = qs.parse(url);

      expect(parsed.query).toBe("test");
      expect(Object.keys(parsed)).toHaveLength(1);
    });

    it("should handle URLs with empty values", () => {
      const url = "query=&result=taxon";
      const parsed = qs.parse(url);

      expect(parsed.query).toBe("");
      expect(parsed.result).toBe("taxon");
    });

    it("should handle URLs with special characters", () => {
      const specialChars = "()[]{}!@#$%^&*-_=+";
      const params = { query: specialChars };
      const url = qs.stringify(params);
      const parsed = qs.parse(url);

      // URL-encoded version should decode back
      expect(parsed.query).toBe(specialChars);
    });

    it("should handle very long query strings", () => {
      const longQuery = "a".repeat(1000);
      const params = { query: longQuery };
      const url = qs.stringify(params);
      const parsed = qs.parse(url);

      expect(parsed.query).toBe(longQuery);
    });
  });

  describe("URL parameter types", () => {
    it("should handle numeric string parameters", () => {
      const params = {
        limit: "100",
        offset: "50",
        threshold: "0.95",
      };

      const url = qs.stringify(params);
      const parsed = qs.parse(url);

      // qs preserves types as strings in URLs
      expect(typeof parsed.limit).toBe("string");
      expect(parsed.limit).toBe("100");
    });

    it("should handle boolean-like parameters", () => {
      const params = {
        countGenomes: "true",
        includeAncestral: "false",
      };

      const url = qs.stringify(params);
      const parsed = qs.parse(url);

      expect(parsed.countGenomes).toBe("true");
      expect(parsed.includeAncestral).toBe("false");
    });
  });

  describe("URL roundtrip consistency", () => {
    it("should maintain consistency through multiple roundtrips", () => {
      const original = {
        query: "test",
        result: "assembly",
        taxonomy: "ncbi",
      };

      let current = original;

      for (let i = 0; i < 5; i++) {
        const url = qs.stringify(current);
        current = qs.parse(url);
      }

      expect(current).toEqual(original);
    });

    it("should produce identical URLs for equivalent parameters", () => {
      const params = {
        query: "Homo",
        result: "taxon",
        taxonomy: "ncbi",
      };

      const url1 = qs.stringify(params);
      const url2 = qs.stringify(params);

      expect(url1).toBe(url2);
    });
  });
});
