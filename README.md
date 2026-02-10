# skill-search 🔍

[![Tests](https://img.shields.io/github/actions/workflow/status/Michaelliv/skill-search-cli/ci.yml?label=Tests&color=brightgreen)](https://github.com/Michaelliv/skill-search-cli/actions/workflows/ci.yml) [![License](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT) [![npm](https://img.shields.io/npm/v/skill-search-cli)](https://www.npmjs.com/package/skill-search-cli)

**Find AI agent skills instantly — local and remote.**

---

## The Problem

You have skills installed across multiple AI agents (Claude Code, Cursor, Cline, etc.), but:
- 🤷 "Do I already have a skill for this?"
- 🔍 "Which agent has the React skill?"
- 📦 "What's available in the skills registry?"
- 🧩 "How do I see all my installed skills?"

Searching manually means checking directories, grepping SKILL.md files, and visiting skills.sh in your browser.

**There's a better way.**

---

## What if you could search all your skills at once?

```bash
# Search both local and remote skills
$ skill-search react

Local Skills (1):
  vercel-react-best-practices (~/.claude/skills/vercel-react-best-practices/SKILL.md) [Claude Code]
    Best practices and patterns for React development from Vercel's engineering team.

Remote Skills (3):
  vercel-react-best-practices              vercel-labs/agent-skills
    115,410 installs
  react-testing-best-practices             composiohq/awesome-claude-skills
    42,103 installs
  react-native-best-practices              mobile-dev/agent-skills
    28,

562 installs
```

**One command. All your agents. Plus the entire registry.**

---

## For Humans

You install once. Your agents use it forever.

### Installation

```bash
npm install -g skill-search-cli
```

### Setup (one-time)

```bash
# Teach your agents how to use skill-search
skill-search onboard
```

This adds instructions to `~/.claude/CLAUDE.md` (or `AGENTS.md` for other agents), teaching them:
- How to search for skills
- When to check local vs remote
- How to list installed skills

That's it! Now your agents can discover skills on their own.

### Quick Start

```bash
# Search everywhere
skill-search react

# Search only local skills
skill-search --local database

# Search only remote (skills.sh registry)
skill-search --remote vercel --limit 5

# List all installed skills
skill-search list

# List skills for specific agent
skill-search list --agent claude-code

# JSON output (for scripts/agents)
skill-search --json react
```

---

## For Agents

**You discover skills. Humans install them.**

### Find Existing Skills

Before suggesting a human install a skill, check if it already exists:

```bash
# Search local skills
skill-search --local "<topic>"

# Examples
skill-search --local "docker"
skill-search --local "kubernetes"
skill-search --local "testing"
```

### Discover New Skills

Browse the remote registry to find relevant skills:

```bash
# Search remote skills
skill-search --remote "<topic>"

# Limit results
skill-search --remote "vercel" --limit 5
```

### List All Skills

```bash
# All installed skills
skill-search list

# Skills for specific agent
skill-search list --agent claude-code
```

### Output Format

**Pretty (default):**
```
Local Skills (2):
  skill-name (~/.claude/skills/skill-name/SKILL.md) [Agent Name]
    Skill description wraps nicely at 90 characters with proper indentation for
    continuation lines.

Remote Skills (3):
  skill-name                               owner/repo
    Skill description here  1,234 installs
```

**JSON (--json flag):**
```json
{
  "local": [{
    "name": "skill-name",
    "description": "...",
    "path": "~/.claude/skills/skill-name/SKILL.md",
    "agent": "Claude Code",
    "internal": false
  }],
  "remote": [{
    "id": "owner/repo/skill-name",
    "name": "skill-name",
    "source": "owner/repo",
    "installs": 1234,
    "description": "..."
  }]
}
```

---

## Supported Agents

skill-search automatically detects and searches skills from **40+ AI agents**:

- ✅ Claude Code
- ✅ Cursor
- ✅ Cline
- ✅ Windsurf
- ✅ Goose
- ✅ OpenCode
- ✅ Codex
- ✅ Continue
- ✅ And 30+ more...

When you run `skill-search list`, it scans all detected agents and shows you everything.

---

## How It Works

```
┌─────────────────────────────────────────────────┐
│  Agent                                          │
│                                                 │
│  "Do we have a skill for React?"                │
│  > skill-search --local react                   │
│                                                 │
│  ✓ Found: vercel-react-best-practices          │
│  📁 ~/.claude/skills/vercel-react-best-practices│
│                                                 │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  skill-search                                   │
│                                                 │
│  1. Detect installed agents (40+ supported)     │
│  2. Scan ~/.agent/skills directories            │
│  3. Parse SKILL.md files (YAML frontmatter)     │
│  4. Build search index (MiniSearch fuzzy)       │
│  5. Query skills.sh API (parallel)              │
│  6. Return formatted results                    │
└─────────────────────────────────────────────────┘
```

**Features:**
- Fuzzy search with MiniSearch (typo-tolerant)
- Searches name, description, and tags
- Handles symlinked skills correctly
- Caches for speed (<100ms searches)
- Parallel local + remote queries
- Respects `internal: true` flag
- Works in CI/headless environments

---

## Commands

### Search

```bash
skill-search <query>                   # Search both local and remote
skill-search --local <query>           # Search only local
skill-search --remote <query>          # Search only remote
skill-search --limit <n> <query>       # Limit remote results (default: 10)
skill-search --json <query>            # Output as JSON
skill-search --no-color                # Disable colors
```

### List

```bash
skill-search list                      # List all local skills
skill-search list --agent <name>       # Filter by agent
skill-search list --json               # JSON output
```

### Onboard

```bash
skill-search onboard                   # Add to agent memory (all agents)
skill-search onboard --json            # JSON output
skill-search onboard --quiet           # Suppress output
```

---

## FAQ

**Q: Why not just use `npx skills find`?**

`npx skills find` searches the remote registry. skill-search searches **both** your local skills and the remote registry, and works across 40+ agents.

**Q: Does this work with my agent?**

If your agent stores skills in a directory and uses SKILL.md files, probably yes. We support 40+ agents out of the box. If yours isn't detected, [open an issue](https://github.com/Michaelliv/skill-search-cli/issues).

**Q: Can I use this in CI?**

Yes! It works in headless environments. Use `--json` for machine-readable output.

**Q: How fast is local search?**

First search builds the index (~200ms with 50 skills). Subsequent searches are <50ms thanks to caching.

**Q: Does it respect `internal: true`?**

Yes. Skills marked `internal: true` are filtered out by default.

---

## Philosophy

- **Agent-first**: Designed for AI agents to discover skills autonomously
- **Multi-agent**: Works with 40+ agents, not just one
- **Fast**: Caching and parallel queries for speed
- **Simple**: One command for everything
- **Zero config**: Detects agents automatically

---

## Development

```bash
# Install dependencies
bun install

# Run locally
bun run src/main.ts --help

# Run tests
bun test

# Build single binary
bun run build

# Build for all platforms
bun run build:linux
bun run build:mac-arm
bun run build:mac-x64
```

---

## License

MIT

---

<p align="center">
  <b>skill-search</b> — <i>find skills across all your agents</i>
</p>
