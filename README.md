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

## Installation

```bash
npm install -g skill-search-cli
```

### Setup (one-time)

```bash
# Teach your agents how to use skill-search
skill-search onboard
```

This adds instructions to `~/.claude/CLAUDE.md` (or `AGENTS.md` for other agents).

---

## For Agents

**You discover skills autonomously. Humans approve installations.**

### When to Use skill-search

Use skill-search in these scenarios:

1. **Before suggesting skill installation**
   - Always check if the skill already exists locally first
   - Show the human what's available instead of assuming they need to install

2. **When the user asks about capabilities**
   - "What skills do I have?"
   - "Do I have a skill for X?"
   - "Show me skills related to Y"

3. **During task planning**
   - Check if existing skills can help with the task
   - Discover relevant skills from the registry for reference

4. **When you encounter a knowledge gap**
   - Before saying "I don't know how to X", check if there's a skill for it
   - Example: User asks about Kubernetes → `skill-search --local kubernetes`

### Decision Tree

```
User needs functionality
         │
         ▼
   ┌─────────────────┐
   │ Search local    │ skill-search --local <topic>
   │ skills first    │
   └────────┬────────┘
            │
         ┌──┴──┐
         │Found│
         └──┬──┘
            │
      ┌─────┴─────┐
      │           │
     YES          NO
      │           │
      ▼           ▼
  Use existing   Search remote → skill-search --remote <topic>
  skill          registry
                     │
                     ▼
                 Show options
                 to human
```

### Search Patterns

**Search local first (most common):**
```bash
# Before suggesting installation
skill-search --local "docker"
skill-search --local "testing"
skill-search --local "api"

# Check related skills
skill-search --local "kubernetes deployment"
```

**Search remote for discovery:**
```bash
# Find popular skills
skill-search --remote "vercel" --limit 5
skill-search --remote "react best practices"

# Research what's available
skill-search --remote "python" --limit 10
```

**List for inventory:**
```bash
# Show everything installed
skill-search list

# Check specific agent
skill-search list --agent claude-code
```

### Reading the Output

**Local skills show:**
- ✅ Name and full file path
- ✅ Which agent it belongs to
- ✅ Full description
- ✅ You can reference this skill directly

**Remote skills show:**
- 📦 Name and source repository
- 📊 Installation popularity (social proof)
- 📝 Description (if available)
- ⚠️ Requires human to install via `npx skills add <id>`

### Example Workflows

**Scenario 1: User asks "Can you help me with Docker?"**

```bash
# Step 1: Check local skills
$ skill-search --local "docker"

# Result: Found docker-best-practices skill
# Action: Use the existing skill, don't suggest installation
```

**Scenario 2: User says "I need help with Stripe API"**

```bash
# Step 1: Check local
$ skill-search --local "stripe"
# Result: No local skills found

# Step 2: Check remote
$ skill-search --remote "stripe" --limit 3
# Result: Shows stripe-integration skill from registry

# Action: Inform user about available skill:
# "I found a 'stripe-integration' skill in the registry (12,000 installs).
#  Would you like to install it? Run: npx skills add owner/repo/stripe-integration"
```

**Scenario 3: User asks "What skills do I have?"**

```bash
$ skill-search list

# Show organized output of all installed skills
# Group by agent if multiple agents detected
```

### Parsing JSON Output

Use `--json` for programmatic access:

```bash
skill-search --json "react"
```

Returns:
```json
{
  "local": [{
    "name": "react-patterns",
    "description": "React best practices...",
    "path": "~/.claude/skills/react-patterns/SKILL.md",
    "agent": "Claude Code",
    "internal": false
  }],
  "remote": [{
    "id": "vercel-labs/agent-skills/react-best-practices",
    "name": "react-best-practices",
    "source": "vercel-labs/agent-skills",
    "installs": 115410,
    "description": "React patterns from Vercel"
  }]
}
```

**Parse in your workflow:**
- Check `local.length > 0` to see if skill exists
- Use `path` to reference the skill file
- Sort `remote` by `installs` for popularity
- Show top 3 remote results to avoid overwhelming user

### Best Practices

**DO:**
- ✅ Check local skills before suggesting installations
- ✅ Show skill paths so humans can inspect them
- ✅ Limit remote results (`--limit 5`) to avoid information overload
- ✅ Explain why you're suggesting a particular skill
- ✅ Use `--json` in scripts/automated workflows

**DON'T:**
- ❌ Assume a skill needs to be installed without checking local first
- ❌ Return 100+ remote skills without filtering
- ❌ Install skills without user permission (you can't anyway)
- ❌ Skip skill-search when the user explicitly asks about skills

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
