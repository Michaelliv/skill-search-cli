import { describe, it, expect, mock, beforeEach } from "bun:test";
import { searchRemoteSkills } from "./remote-search.ts";

describe("searchRemoteSkills", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mock.restore();
  });

  it("should fetch and parse skills from API", async () => {
    const mockResponse = {
      skills: [
        {
          id: "test/repo/skill-1",
          name: "skill-1",
          source: "test/repo",
          installs: 1000,
          description: "Test skill 1",
        },
        {
          id: "test/repo/skill-2",
          name: "skill-2",
          source: "test/repo",
          installs: 500,
          description: "Test skill 2",
        },
      ],
    };

    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response),
    );

    const results = await searchRemoteSkills("test", 10);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      id: "test/repo/skill-1",
      name: "skill-1",
      source: "test/repo",
      installs: 1000,
      description: "Test skill 1",
    });
  });

  it("should respect limit parameter", async () => {
    const mockResponse = {
      skills: [
        {
          id: "test/repo/skill-1",
          name: "skill-1",
          source: "test/repo",
          installs: 1000,
        },
      ],
    };

    const fetchMock = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response),
    );
    global.fetch = fetchMock;

    await searchRemoteSkills("test", 5);

    // Check that the URL includes the limit parameter
    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain("limit=5");
  });

  it("should return empty array on API error", async () => {
    global.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response),
    );

    const results = await searchRemoteSkills("test", 10);

    expect(results).toEqual([]);
  });

  it("should return empty array on network error", async () => {
    global.fetch = mock(() =>
      Promise.reject(new Error("Network error")),
    );

    const results = await searchRemoteSkills("test", 10);

    expect(results).toEqual([]);
  });

  it("should handle missing description", async () => {
    const mockResponse = {
      skills: [
        {
          id: "test/repo/skill-1",
          name: "skill-1",
          source: "test/repo",
          installs: 1000,
          // description omitted
        },
      ],
    };

    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response),
    );

    const results = await searchRemoteSkills("test", 10);

    expect(results[0].description).toBeUndefined();
  });
});
