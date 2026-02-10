import { readdirSync, statSync, readlinkSync } from "fs";
import { join } from "path";
import MiniSearch from "minisearch";
import { detectInstalledAgents, getAgentConfig } from "./agents.ts";
import { parseSkillFile } from "./parser.ts";
import type { LocalSkill, AgentType } from "./types.ts";

let skillsCache: LocalSkill[] | null = null;
let searchIndex: MiniSearch<LocalSkill> | null = null;

/**
 * Recursively find all SKILL.md files in a directory
 * Handles symlinks properly
 */
function findSkillFiles(dir: string, maxDepth = 3, currentDepth = 0): string[] {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const files: string[] = [];
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      let stat;

      try {
        stat = statSync(fullPath);
      } catch {
        // Skip files/dirs we can't stat
        continue;
      }

      if (stat.isSymbolicLink()) {
        try {
          // Follow symlink and check if it points to a directory
          const realPath = readlinkSync(fullPath);
          const resolvedPath = realPath.startsWith("/")
            ? realPath
            : join(dir, realPath);
          const targetStat = statSync(resolvedPath);

          if (targetStat.isDirectory()) {
            files.push(...findSkillFiles(resolvedPath, maxDepth, currentDepth + 1));
          }
        } catch {
          // Skip broken symlinks
          continue;
        }
      } else if (stat.isDirectory()) {
        files.push(...findSkillFiles(fullPath, maxDepth, currentDepth + 1));
      } else if (entry === "SKILL.md") {
        files.push(fullPath);
      }
    }

    return files;
  } catch {
    // Directory doesn't exist or can't be read
    return [];
  }
}

/**
 * Get all local skills from installed agents
 */
export async function getAllLocalSkills(): Promise<LocalSkill[]> {
  // Return cached results if available
  if (skillsCache) {
    return skillsCache;
  }

  const skills: LocalSkill[] = [];
  const installedAgents = await detectInstalledAgents();

  for (const agentType of installedAgents) {
    const config = getAgentConfig(agentType);

    // Search in global skills directory
    if (config.globalSkillsDir) {
      const skillFiles = findSkillFiles(config.globalSkillsDir);

      for (const filePath of skillFiles) {
        const skill = parseSkillFile(filePath, config.displayName);
        if (skill) {
          skills.push(skill);
        }
      }
    }

    // Search in project-local skills directory
    const projectSkillsDir = join(process.cwd(), config.skillsDir);
    const projectSkillFiles = findSkillFiles(projectSkillsDir);

    for (const filePath of projectSkillFiles) {
      const skill = parseSkillFile(filePath, config.displayName);
      // Avoid duplicates (same path)
      if (skill && !skills.some((s) => s.path === skill.path)) {
        skills.push(skill);
      }
    }
  }

  skillsCache = skills;
  return skills;
}

/**
 * Get skills for a specific agent
 */
export async function getSkillsForAgent(
  agentType: AgentType,
): Promise<LocalSkill[]> {
  const allSkills = await getAllLocalSkills();
  const config = getAgentConfig(agentType);
  return allSkills.filter((skill) => skill.agent === config.displayName);
}

/**
 * Build search index from skills
 */
function buildSearchIndex(skills: LocalSkill[]): MiniSearch<LocalSkill> {
  const miniSearch = new MiniSearch<LocalSkill>({
    fields: ["name", "description", "tags"], // Fields to index
    storeFields: ["name", "description", "path", "agent", "internal", "tags"], // Fields to return
    idField: "path", // Use path as unique identifier
    searchOptions: {
      boost: { name: 2 }, // Boost matches in name
      fuzzy: 0.2, // Enable fuzzy matching
      prefix: true, // Enable prefix matching
    },
  });

  // Filter out internal skills by default
  const publicSkills = skills.filter((skill) => !skill.internal);
  miniSearch.addAll(publicSkills);

  return miniSearch;
}

/**
 * Search local skills by query
 */
export async function searchLocalSkills(query: string): Promise<LocalSkill[]> {
  const skills = await getAllLocalSkills();

  // Build search index if not cached
  if (!searchIndex) {
    searchIndex = buildSearchIndex(skills);
  }

  // If query is empty, return all public skills
  if (!query.trim()) {
    return skills.filter((skill) => !skill.internal);
  }

  // Perform search
  const results = searchIndex.search(query);

  // Map search results back to LocalSkill objects
  return results.map((result) => {
    const skill = skills.find((s) => s.name === result.name && s.path === result.path);
    return skill!;
  });
}

/**
 * Clear the cache (useful for testing or when skills are updated)
 */
export function clearCache(): void {
  skillsCache = null;
  searchIndex = null;
}
