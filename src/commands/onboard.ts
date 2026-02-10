import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import chalk from "chalk";
import { detectInstalledAgents, getAgentConfig } from "../agents.ts";

const SKILL_SEARCH_INSTRUCTIONS = `
<!-- skill-search:onboard -->
## Skill Search CLI

Use \`skill-search\` to discover AI agent skills from both local installations and the remote skills.sh registry.

<commands>
- \`skill-search <query>\` - Search both local and remote skills
- \`skill-search --local <query>\` - Search only locally installed skills
- \`skill-search --remote <query>\` - Search only remote skills from skills.sh
- \`skill-search list\` - List all locally installed skills
- \`skill-search list --agent <name>\` - List skills from a specific agent
- \`skill-search --json <query>\` - Output results as JSON
- \`skill-search --limit <n> <query>\` - Limit remote results (default: 10)
</commands>

<examples>
- \`skill-search react\` - Find React-related skills
- \`skill-search --local log\` - Search local skills for "log"
- \`skill-search --remote vercel --limit 5\` - Find top 5 Vercel skills from registry
- \`skill-search list\` - Show all installed skills
- \`skill-search list --agent claude-code\` - Show only Claude Code skills
</examples>

<when-to-use>
- User asks "what skills do I have?" or "show me my skills"
- User wants to find skills related to a topic (e.g., "find database skills")
- User asks about available skills for a specific agent
- User wants to discover new skills from the registry
- Before suggesting to install a skill, check if it already exists locally
</when-to-use>

<output>
Local skills show:
- Skill name and path (\`~/.claude/skills/skill-name/SKILL.md\`)
- Agent name (e.g., [Claude Code])
- Full description with word wrapping

Remote skills show:
- Skill name and source repository
- Install count
- Description (if available)
</output>
`.trim();

const MARKER = "<!-- skill-search:onboard -->";

interface OnboardOptions {
  json?: boolean;
  quiet?: boolean;
}

interface OnboardResult {
  file: string;
  agent: string;
  status: "added" | "already_onboarded" | "error";
  error?: string;
}

async function onboardToAgent(
  agentDir: string,
  agentName: string,
  preferClaude: boolean,
): Promise<OnboardResult> {
  // Determine which file to use
  const claudeMd = join(agentDir, "CLAUDE.md");
  const agentsMd = join(agentDir, "AGENTS.md");

  let targetFile: string;
  if (preferClaude) {
    targetFile = existsSync(claudeMd) ? claudeMd : existsSync(agentsMd) ? agentsMd : claudeMd;
  } else {
    targetFile = existsSync(agentsMd) ? agentsMd : existsSync(claudeMd) ? claudeMd : agentsMd;
  }

  try {
    let existingContent = "";
    if (existsSync(targetFile)) {
      existingContent = readFileSync(targetFile, "utf-8");
    }

    // Check if already onboarded
    if (existingContent.includes(MARKER)) {
      return {
        file: targetFile,
        agent: agentName,
        status: "already_onboarded",
      };
    }

    // Ensure directory exists
    const targetDir = dirname(targetFile);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    // Add instructions
    if (existingContent) {
      const newContent = `${existingContent.trimEnd()}\n\n${SKILL_SEARCH_INSTRUCTIONS}\n`;
      writeFileSync(targetFile, newContent);
    } else {
      writeFileSync(targetFile, `${SKILL_SEARCH_INSTRUCTIONS}\n`);
    }

    return {
      file: targetFile,
      agent: agentName,
      status: "added",
    };
  } catch (error) {
    return {
      file: targetFile,
      agent: agentName,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function onboard(options: OnboardOptions = {}): Promise<void> {
  const home = homedir();
  const installedAgents = await detectInstalledAgents();

  if (installedAgents.length === 0) {
    if (options.json) {
      console.log(
        JSON.stringify({
          success: false,
          error: "No agents detected. Please install an AI agent first.",
        }),
      );
    } else {
      console.log(chalk.yellow("⚠"), "No AI agents detected");
      console.log();
      console.log(
        "Please install an AI agent (Claude Code, Cursor, Cline, etc.) first.",
      );
    }
    process.exit(1);
  }

  const results: OnboardResult[] = [];

  // Onboard to all detected agents
  for (const agentType of installedAgents) {
    const config = getAgentConfig(agentType);

    // Determine agent directory
    const agentDir = config.globalSkillsDir
      ? dirname(config.globalSkillsDir)
      : join(home, `.${config.name}`);

    // Claude Code prefers CLAUDE.md, others prefer AGENTS.md
    const preferClaude = agentType === "claude-code";

    const result = await onboardToAgent(agentDir, config.displayName, preferClaude);
    results.push(result);
  }

  // Output results
  if (options.json) {
    console.log(
      JSON.stringify({
        success: true,
        results,
      }),
    );
  } else if (!options.quiet) {
    const added = results.filter((r) => r.status === "added");
    const alreadyOnboarded = results.filter((r) => r.status === "already_onboarded");
    const errors = results.filter((r) => r.status === "error");

    if (added.length > 0) {
      console.log(chalk.green("✓"), `Added skill-search instructions to ${added.length} agent${added.length > 1 ? "s" : ""}:`);
      for (const result of added) {
        console.log(chalk.dim(`  ${result.agent}: ${result.file}`));
      }
      console.log();
    }

    if (alreadyOnboarded.length > 0) {
      console.log(chalk.green("✓"), `Already onboarded to ${alreadyOnboarded.length} agent${alreadyOnboarded.length > 1 ? "s" : ""}:`);
      for (const result of alreadyOnboarded) {
        console.log(chalk.dim(`  ${result.agent}: ${result.file}`));
      }
      console.log();
    }

    if (errors.length > 0) {
      console.log(chalk.red("✗"), `Failed to onboard ${errors.length} agent${errors.length > 1 ? "s" : ""}:`);
      for (const result of errors) {
        console.log(chalk.dim(`  ${result.agent}: ${result.error}`));
      }
      console.log();
    }

    if (added.length > 0 || alreadyOnboarded.length > 0) {
      console.log(chalk.dim("Your agents now know how to use skill-search!"));
      console.log();
    }
  }
}
