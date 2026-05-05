import { describe, expect, it } from "vitest";

import qs from "../qs";

describe("qs utility", () => {
  describe("parse", () => {
    it("should parse a simple query string", () => {
      const result = qs.parse("foo=bar&baz=qux");
      expect(result).toEqual({
        foo: "bar",
        baz: "qux",
      });
    });

    it("should parse empty string", () => {
      const result = qs.parse("");
      expect(result).toEqual({});
    });

    it("should parse query string with arrays", () => {
      const result = qs.parse("tag=a&tag=b&tag=c");
      expect(result.tag).toEqual(["a", "b", "c"]);
    });

    it("should parse query string with special characters", () => {
      const result = qs.parse("search=hello%20world&query=test%2Fvalue");
      expect(result.search).toBe("hello world");
      expect(result.query).toBe("test/value");
    });
  });

  describe("stringify", () => {
    it("should stringify a simple object", () => {
      const result = qs.stringify({ foo: "bar", baz: "qux" });
      expect(result).toContain("foo=bar");
      expect(result).toContain("baz=qux");
    });

    it("should stringify empty object", () => {
      const result = qs.stringify({});
      expect(result).toBe("");
    });

    it("should stringify object with array values", () => {
      const result = qs.stringify({ tag: ["a", "b", "c"] });
      // qs library encodes arrays as indexed parameters
      expect(result).toContain("tag%5B0%5D=a");
      expect(result).toContain("tag%5B1%5D=b");
      expect(result).toContain("tag%5B2%5D=c");
    });

    it("should stringify and encode special characters", () => {
      const result = qs.stringify({ search: "hello world" });
      expect(result).toContain("hello");
      expect(result).toContain("world");
    });
  });

  describe("roundtrip", () => {
    it("should parse and stringify back to equivalent query string", () => {
      const original = "foo=bar&baz=qux&count=5";
      const parsed = qs.parse(original);
      const stringified = qs.stringify(parsed);
      const reparsed = qs.parse(stringified);
      expect(reparsed).toEqual(parsed);
    });
  });
});
