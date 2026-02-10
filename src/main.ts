#!/usr/bin/env bun

import chalk from "chalk";

const VERSION = "0.0.1";

function showHelp() {
  console.log(`
${chalk.bold("skill-search-cli")} v${VERSION}

${chalk.bold("Usage:")}
  skill-search [command] [options]

${chalk.bold("Commands:")}
  help               Show this help message
  version            Show version

${chalk.bold("Options:")}
  -h, --help         Show help
  -v, --version      Show version
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help") || args[0] === "help") {
    showHelp();
    return;
  }

  if (args.includes("-v") || args.includes("--version") || args[0] === "version") {
    console.log(VERSION);
    return;
  }

  console.log(chalk.red(`Unknown command: ${args[0]}`));
  console.log(chalk.dim("Run 'skill-search --help' for usage information"));
  process.exit(1);
}

main();
