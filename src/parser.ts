import { readFileSync } from "fs";
import matter from "gray-matter";
import type { LocalSkill } from "./types.ts";

/**
 * Parse a SKILL.md file and extract metadata
 * @param filePath Path to the SKILL.md file
 * @param agent Agent name this skill belongs to
 * @returns LocalSkill object or null if invalid
 */
export function parseSkillFile(
  filePath: string,
  agent: string,
): LocalSkill | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    const { data } = matter(content);

    // Skill must have at least a name
    if (!data.name) {
      return null;
    }

    return {
      name: data.name,
      description: data.description || "",
      path: filePath,
      agent,
      internal: data.internal === true,
      tags: Array.isArray(data.tags) ? data.tags : undefined,
    };
  } catch (error) {
    // Silently skip files that can't be parsed
    return null;
  }
}
