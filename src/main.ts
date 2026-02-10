#!/usr/bin/env bun

import chalk from "chalk";
import { Command } from "commander";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getAllLocalSkills, searchLocalSkills, getSkillsForAgent } from "./local-search.ts";
import { searchRemoteSkills } from "./remote-search.ts";
import { onboard } from "./commands/onboard.ts";
import type { SearchResult, SearchOptions, AgentType, LocalSkill, RemoteSkill } from "./types.ts";

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);
const VERSION = packageJson.version;

function wrapText(text: string, width: number, indent: string): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= width) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.map((line, i) => (i === 0 ? line : `${indent}${line}`));
}

function formatLocalSkills(skills: LocalSkill[], noColor: boolean): string {
  if (skills.length === 0) {
    return noColor ? "No local skills found" : chalk.dim("No local skills found");
  }

  const output: string[] = [];
  const header = noColor
    ? `Local Skills (${skills.length}):`
    : chalk.bold(`Local Skills (${skills.length}):`);
  output.push(header);

  for (const skill of skills) {
    const nameColor = noColor ? skill.name : chalk.cyan(skill.name);
    const agent = noColor ? `[${skill.agent}]` : chalk.dim(`[${skill.agent}]`);

    // Replace home directory with ~
    const homedir = require("os").homedir();
    const displayPath = skill.path.replace(homedir, "~");
    const pathText = noColor ? `(${displayPath})` : chalk.dim(`(${displayPath})`);

    output.push(`  ${nameColor} ${pathText} ${agent}`);

    // Wrap description nicely
    if (skill.description) {
      const wrappedLines = wrapText(skill.description, 90, "    ");
      for (const line of wrappedLines) {
        const coloredLine = noColor ? `    ${line}` : `    ${chalk.gray(line)}`;
        output.push(coloredLine);
      }
    }

    output.push(""); // blank line between skills
  }

  return output.join("\n");
}

function formatRemoteSkills(skills: RemoteSkill[], noColor: boolean): string {
  if (skills.length === 0) {
    return noColor ? "No remote skills found" : chalk.dim("No remote skills found");
  }

  const output: string[] = [];
  const header = noColor
    ? `Remote Skills (${skills.length}):`
    : chalk.bold(`Remote Skills (${skills.length}):`);
  output.push(header);

  for (const skill of skills) {
    const nameColor = noColor ? skill.name : chalk.cyan(skill.name);
    const source = noColor ? skill.source : chalk.dim(skill.source);
    const installs = noColor
      ? `${skill.installs.toLocaleString()} installs`
      : chalk.yellow(`${skill.installs.toLocaleString()} installs`);

    output.push(`  ${nameColor.padEnd(40)} ${source}`);
    if (skill.description) {
      const desc = noColor ? skill.description : chalk.gray(skill.description);
      output.push(`    ${desc}  ${installs}`);
    } else {
      output.push(`    ${installs}`);
    }
  }

  return output.join("\n");
}

async function search(query: string, options: SearchOptions): Promise<SearchResult> {
  const results: SearchResult = { local: [], remote: [] };

  // Run searches in parallel if both are enabled
  const promises: Promise<void>[] = [];

  if (options.local) {
    promises.push(
      searchLocalSkills(query).then((skills) => {
        results.local = skills;
      }),
    );
  }

  if (options.remote) {
    promises.push(
      searchRemoteSkills(query, options.limit).then((skills) => {
        results.remote = skills;
      }),
    );
  }

  await Promise.all(promises);
  return results;
}

async function handleSearch(query: string, options: SearchOptions) {
  const results = await search(query, options);

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Pretty output
  const output: string[] = [];

  if (options.local && results.local.length > 0) {
    output.push(formatLocalSkills(results.local, options.noColor));
  }

  if (options.remote && results.remote.length > 0) {
    if (output.length > 0) {
      output.push(""); // Add blank line between sections
    }
    output.push(formatRemoteSkills(results.remote, options.noColor));
  }

  if (output.length === 0) {
    console.log(
      options.noColor
        ? "No skills found"
        : chalk.yellow("No skills found"),
    );
  } else {
    console.log(output.join("\n"));
  }
}

async function handleList(agentFilter?: string, noColor = false) {
  if (agentFilter) {
    // List skills for specific agent
    try {
      const skills = await getSkillsForAgent(agentFilter as AgentType);
      if (skills.length === 0) {
        console.log(
          noColor
            ? `No skills found for agent: ${agentFilter}`
            : chalk.yellow(`No skills found for agent: ${agentFilter}`),
        );
      } else {
        console.log(formatLocalSkills(skills, noColor));
      }
    } catch {
      console.error(
        noColor
          ? `Unknown agent: ${agentFilter}`
          : chalk.red(`Unknown agent: ${agentFilter}`),
      );
      process.exit(1);
    }
  } else {
    // List all local skills
    const skills = await getAllLocalSkills();
    console.log(formatLocalSkills(skills, noColor));
  }
}

const program = new Command();

program
  .name("skill-search")
  .description("Search for AI agent skills locally and remotely")
  .version(VERSION);

// Default command (search)
program
  .argument("[query...]", "search query")
  .option("--local", "search only local skills")
  .option("--remote", "search only remote skills")
  .option("--json", "output results as JSON")
  .option("--limit <number>", "limit remote results", "10")
  .option("--no-color", "disable colored output")
  .action(async (queryArgs: string[], options) => {
    const query = queryArgs.join(" ");

    if (!query) {
      program.help();
      return;
    }

    // Default to searching both if neither specified
    const searchLocal = options.local || !options.remote;
    const searchRemote = options.remote || !options.local;

    const searchOptions: SearchOptions = {
      local: searchLocal,
      remote: searchRemote,
      json: options.json || false,
      limit: parseInt(options.limit, 10),
      noColor: !options.color,
    };

    await handleSearch(query, searchOptions);
  });

// List command
program
  .command("list")
  .description("list all local skills")
  .option("--agent <name>", "filter by agent name")
  .option("--no-color", "disable colored output")
  .action(async (options) => {
    await handleList(options.agent, !options.color);
  });

// Onboard command
program
  .command("onboard")
  .description("add skill-search instructions to your agent memory (AGENTS.md or CLAUDE.md)")
  .option("--json", "output as JSON")
  .option("--quiet", "suppress output")
  .action(async (options) => {
    await onboard({
      json: options.json,
      quiet: options.quiet,
    });
  });

// Parse and execute
program.parse();
