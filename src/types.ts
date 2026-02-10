// Type definitions for agent configurations and skill search
// Extends types from vercel-labs/skills (MIT licensed)

export type AgentType =
  | "amp"
  | "antigravity"
  | "augment"
  | "claude-code"
  | "openclaw"
  | "cline"
  | "codebuddy"
  | "codex"
  | "command-code"
  | "continue"
  | "crush"
  | "cursor"
  | "droid"
  | "gemini-cli"
  | "github-copilot"
  | "goose"
  | "iflow-cli"
  | "junie"
  | "kilo"
  | "kimi-cli"
  | "kiro-cli"
  | "kode"
  | "mcpjam"
  | "mistral-vibe"
  | "mux"
  | "neovate"
  | "opencode"
  | "openhands"
  | "pi"
  | "qoder"
  | "qwen-code"
  | "replit"
  | "roo"
  | "trae"
  | "trae-cn"
  | "windsurf"
  | "zencoder"
  | "pochi"
  | "adal";

export interface AgentConfig {
  name: string;
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string | undefined;
  detectInstalled: () => Promise<boolean>;
  showInUniversalList?: boolean;
}

// Custom types for skill search CLI

export interface LocalSkill {
  name: string;
  description: string;
  path: string;
  agent: string;
  internal?: boolean;
  tags?: string[];
}

export interface RemoteSkill {
  id: string;
  name: string;
  source: string;
  installs: number;
  description?: string;
}

export interface SearchResult {
  local: LocalSkill[];
  remote: RemoteSkill[];
}

export interface SearchOptions {
  local: boolean;
  remote: boolean;
  json: boolean;
  limit: number;
  noColor: boolean;
  agent?: string;
}
