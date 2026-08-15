import { describe, expect, it } from "vite-plus/test";
import { filterGuilds, parseGuildSession, serializeGuilds } from "./guild";

const guilds = [
  { id: "1", name: "Vue Land", icon: null, owner: false },
  { id: "2", name: "TypeScript JP", icon: "hash", owner: true },
] as const;

describe("parseGuildSession", () => {
  it("accepts a valid ready response", () => {
    expect(parseGuildSession({ status: "ready", guilds })).toEqual({ status: "ready", guilds });
  });

  it("rejects malformed guild data", () => {
    expect(() => parseGuildSession({ status: "ready", guilds: [{ id: 1 }] })).toThrow("不正な応答");
  });
});

describe("filterGuilds", () => {
  it("matches names without case sensitivity", () => {
    expect(filterGuilds(guilds, "vue")).toEqual([guilds[0]]);
  });
});

describe("serializeGuilds", () => {
  it("creates readable JSON with a final newline", () => {
    expect(serializeGuilds(guilds)).toBe(`${JSON.stringify(guilds, null, 2)}\n`);
  });
});
