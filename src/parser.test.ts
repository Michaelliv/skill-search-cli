import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { parseSkillFile } from "./parser.ts";

const TEST_DIR = "/tmp/skill-search-test-parser";

describe("parseSkillFile", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should parse a valid SKILL.md file", () => {
    const skillPath = join(TEST_DIR, "SKILL.md");
    const content = `---
name: test-skill
description: A test skill
tags:
  - test
  - demo
---

# Test Skill

This is a test skill.
`;

    writeFileSync(skillPath, content);
    const result = parseSkillFile(skillPath, "TestAgent");

    expect(result).toEqual({
      name: "test-skill",
      description: "A test skill",
      path: skillPath,
      agent: "TestAgent",
      internal: false,
      tags: ["test", "demo"],
    });
  });

  it("should handle internal skills", () => {
    const skillPath = join(TEST_DIR, "SKILL.md");
    const content = `---
name: internal-skill
description: An internal skill
internal: true
---

# Internal Skill
`;

    writeFileSync(skillPath, content);
    const result = parseSkillFile(skillPath, "TestAgent");

    expect(result?.internal).toBe(true);
  });

  it("should return null for file without name", () => {
    const skillPath = join(TEST_DIR, "SKILL.md");
    const content = `---
description: Missing name
---

# No Name
`;

    writeFileSync(skillPath, content);
    const result = parseSkillFile(skillPath, "TestAgent");

    expect(result).toBeNull();
  });

  it("should handle missing description", () => {
    const skillPath = join(TEST_DIR, "SKILL.md");
    const content = `---
name: no-desc
---

# No Description
`;

    writeFileSync(skillPath, content);
    const result = parseSkillFile(skillPath, "TestAgent");

    expect(result).toEqual({
      name: "no-desc",
      description: "",
      path: skillPath,
      agent: "TestAgent",
      internal: false,
      tags: undefined,
    });
  });

  it("should return null for invalid YAML", () => {
    const skillPath = join(TEST_DIR, "SKILL.md");
    const content = "This is not valid frontmatter";

    writeFileSync(skillPath, content);
    const result = parseSkillFile(skillPath, "TestAgent");

    expect(result).toBeNull();
  });

  it("should return null for non-existent file", () => {
    const result = parseSkillFile("/non/existent/file.md", "TestAgent");
    expect(result).toBeNull();
  });
});
