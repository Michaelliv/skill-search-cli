import { describe, it, expect } from "bun:test";
import { agents, getAgentConfig, detectInstalledAgents } from "./agents.ts";

describe("agents", () => {
  it("should have all expected agent configurations", () => {
    expect(agents["claude-code"]).toBeDefined();
    expect(agents["claude-code"].name).toBe("claude-code");
    expect(agents["claude-code"].displayName).toBe("Claude Code");
  });

  it("should export getAgentConfig function", () => {
    const config = getAgentConfig("claude-code");
    expect(config.name).toBe("claude-code");
    expect(config.displayName).toBe("Claude Code");
    expect(config.globalSkillsDir).toBeDefined();
    expect(config.detectInstalled).toBeDefined();
  });

  it("should export detectInstalledAgents function", async () => {
    const installed = await detectInstalledAgents();
    expect(Array.isArray(installed)).toBe(true);
  });

  it("should detect installed agents", async () => {
    const installed = await detectInstalledAgents();
    // Should return an array (may be empty in CI environment)
    expect(Array.isArray(installed)).toBe(true);
  });

  it("should have globalSkillsDir for all agents", () => {
    for (const [name, config] of Object.entries(agents)) {
      // Some agents might not have global skills dir, but most should
      expect(config.globalSkillsDir).toBeDefined();
    }
  });
});
