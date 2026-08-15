export type Guild = Readonly<{
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}>;

export type GuildSession =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "pending" }>
  | Readonly<{ status: "ready"; guilds: readonly Guild[] }>
  | Readonly<{ status: "error"; message: string }>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseGuild = (value: unknown): Guild | null => {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }
  if (value.icon !== null && typeof value.icon !== "string") return null;
  if (typeof value.owner !== "boolean") return null;
  return { id: value.id, name: value.name, icon: value.icon, owner: value.owner };
};

export const parseGuildSession = (value: unknown): GuildSession => {
  if (!isRecord(value) || typeof value.status !== "string") {
    throw new Error("サーバーから不正な応答を受け取りました。");
  }
  if (value.status === "idle" || value.status === "pending") return { status: value.status };
  if (value.status === "error" && typeof value.message === "string") {
    return { status: "error", message: value.message };
  }
  if (value.status === "ready" && Array.isArray(value.guilds)) {
    const guilds = value.guilds.map(parseGuild);
    if (guilds.every((guild): guild is Guild => guild !== null)) {
      return { status: "ready", guilds };
    }
  }
  throw new Error("サーバーから不正な応答を受け取りました。");
};

export const filterGuilds = (guilds: readonly Guild[], query: string): readonly Guild[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase("ja");
  if (!normalizedQuery) return guilds;
  return guilds.filter((guild) => guild.name.toLocaleLowerCase("ja").includes(normalizedQuery));
};

export const serializeGuilds = (guilds: readonly Guild[]): string =>
  `${JSON.stringify(guilds, null, 2)}\n`;
