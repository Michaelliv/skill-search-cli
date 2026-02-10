import type { RemoteSkill } from "./types.ts";

const SKILLS_API_URL = "https://skills.sh/api/search";

interface SkillsApiResponse {
  skills: Array<{
    id: string;
    name: string;
    source: string;
    installs: number;
    description?: string;
  }>;
}

/**
 * Search for skills on skills.sh
 * @param query Search query
 * @param limit Maximum number of results (default 10)
 * @returns Array of remote skills
 */
export async function searchRemoteSkills(
  query: string,
  limit = 10,
): Promise<RemoteSkill[]> {
  try {
    const url = new URL(SKILLS_API_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", limit.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as SkillsApiResponse;

    return data.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      source: skill.source,
      installs: skill.installs,
      description: skill.description,
    }));
  } catch (error) {
    // Return empty array on error (network issues, API down, etc.)
    console.error("Failed to fetch remote skills:", error);
    return [];
  }
}
