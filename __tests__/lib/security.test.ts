import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeHtml, isValidUrl } from "@/lib/security";

describe("security", () => {
  describe("sanitizeText", () => {
    it("returns empty string for null/undefined", () => {
      expect(sanitizeText(null)).toBe("");
      expect(sanitizeText(undefined)).toBe("");
    });
    it("trims and limits length", () => {
      expect(sanitizeText("  ab  ", 10)).toBe("ab");
      expect(sanitizeText("a".repeat(100), 5).length).toBeLessThanOrEqual(5);
    });
    it("strips dangerous HTML/script", () => {
      expect(sanitizeText("<script>alert(1)</script>hello")).not.toContain("script");
      expect(sanitizeText("javascript:void(0)")).not.toContain("javascript:");
    });
  });

  describe("sanitizeHtml", () => {
    it("removes script tags", () => {
      expect(sanitizeHtml("<script>x</script>ok")).not.toContain("<script");
    });
    it("returns empty for non-string", () => {
      expect(sanitizeHtml((123 as unknown) as string)).toBe("");
    });
  });

  describe("isValidUrl", () => {
    it("accepts https and http", () => {
      expect(isValidUrl("https://nabz.app")).toBe(true);
      expect(isValidUrl("http://localhost:3000")).toBe(true);
    });
    it("rejects non-http(s)", () => {
      expect(isValidUrl("ftp://x.com")).toBe(false);
      expect(isValidUrl("javascript:alert(1)")).toBe(false);
    });
    it("rejects invalid or non-string", () => {
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(123)).toBe(false);
    });
  });
});
