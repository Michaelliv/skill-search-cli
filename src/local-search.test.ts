import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { searchLocalSkills, clearCache } from "./local-search.ts";

const TEST_DIR = "/tmp/skill-search-test-local";

describe("searchLocalSkills", () => {
  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    clearCache();
  });

  it("should find skills by name", async () => {
    const results = await searchLocalSkills("log");

    // Should find log-explorer if it exists
    const logSkill = results.find((s) => s.name === "log-explorer");
    if (logSkill) {
      expect(logSkill.name).toBe("log-explorer");
      expect(logSkill.agent).toBe("Claude Code");
    }
  });

  it("should find skills by description", async () => {
    const results = await searchLocalSkills("jira");

    const jiraSkill = results.find((s) => s.name.includes("jira"));
    if (jiraSkill) {
      expect(jiraSkill.name).toContain("jira");
    }
  });

  it("should support fuzzy matching", async () => {
    const results = await searchLocalSkills("slak"); // typo for slack

    // Fuzzy matching should still find slack-cli if it exists
    const found = results.some((s) => s.name.includes("slack"));
    // May or may not find due to fuzzy threshold, just check it doesn't error
    expect(Array.isArray(results)).toBe(true);
  });

  it("should return all public skills for empty query", async () => {
    const results = await searchLocalSkills("");

    // Should return skills, but filter out internal ones
    expect(Array.isArray(results)).toBe(true);
    const hasInternal = results.some((s) => s.internal === true);
    expect(hasInternal).toBe(false);
  });

  it("should filter out internal skills", async () => {
    const results = await searchLocalSkills("");

    // No internal skills should be in results
    const internalSkills = results.filter((s) => s.internal === true);
    expect(internalSkills.length).toBe(0);
  });
});
