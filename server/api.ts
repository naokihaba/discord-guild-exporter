import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const discordApiUrl = "https://discord.com/api/v10";
const sessionTtlMs = 10 * 60 * 1000;

type Guild = Readonly<{
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}>;

type Session =
  | { expiresAt: number; state: string; status: "pending" }
  | { expiresAt: number; state: string; status: "ready"; guilds: readonly Guild[] }
  | { expiresAt: number; state: string; status: "error"; message: string };

type DiscordApiConfig = Readonly<{
  appOrigin: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  redirectUri: string;
}>;

type ValidatedConfig = Readonly<{
  appOrigin: URL;
  clientId: string;
  clientSecret: string;
  redirectUri: URL;
}>;

type Next = () => void;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const json = (response: ServerResponse, status: number, value: unknown) => {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(value));
};

const redirect = (response: ServerResponse, location: string, cookie?: string) => {
  response.writeHead(302, {
    "Cache-Control": "no-store",
    Location: location,
    ...(cookie ? { "Set-Cookie": cookie } : {}),
  });
  response.end();
};

const parseCookies = (header = ""): Readonly<Record<string, string>> => {
  const cookies: Record<string, string> = {};
  for (const item of header.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 1) continue;
    const key = item.slice(0, separator).trim();
    const value = item.slice(separator + 1).trim();
    if (key && value) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
};

const createCookie = (sessionId: string, secure: boolean) =>
  `guild_export_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionTtlMs / 1000}${secure ? "; Secure" : ""}`;

const clearCookie = (secure: boolean) =>
  `guild_export_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;

const requestJson = async (url: string, options?: RequestInit): Promise<unknown> => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Discord API error: ${response.status} ${detail.slice(0, 200)}`);
  }
  return response.json();
};

const exchangeCode = (config: ValidatedConfig, code: string) =>
  requestJson(`${discordApiUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri.href,
    }),
  });

const fetchGuilds = async (accessToken: string): Promise<readonly Guild[]> => {
  const value = await requestJson(`${discordApiUrl}/users/@me/guilds?limit=200`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!Array.isArray(value)) throw new Error("Discord APIのサーバー一覧が不正です。");
  return value.map((guild: unknown) => {
    if (!isRecord(guild) || typeof guild.id !== "string" || typeof guild.name !== "string") {
      throw new Error("Discord APIのサーバー情報が不正です。");
    }
    return {
      id: guild.id,
      name: guild.name,
      icon: typeof guild.icon === "string" ? guild.icon : null,
      owner: guild.owner === true,
    };
  });
};

const revokeToken = async (config: ValidatedConfig, token: string) => {
  try {
    await fetch(`${discordApiUrl}/oauth2/token/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        token,
      }),
    });
  } catch {
    // The short-lived session still expires. A failed revocation must not expose the token.
  }
};

const validateConfig = ({
  appOrigin,
  clientId,
  clientSecret,
  redirectUri,
}: DiscordApiConfig): ValidatedConfig => {
  if (!clientId || !clientSecret) {
    throw new Error("DISCORD_CLIENT_ID と DISCORD_CLIENT_SECRET を設定してください。");
  }
  const origin = new URL(appOrigin);
  const callback = new URL(redirectUri);
  if (!callback.pathname.startsWith("/api/auth/callback")) {
    throw new Error("DISCORD_REDIRECT_URI は /api/auth/callback を指す必要があります。");
  }
  return { appOrigin: origin, clientId, clientSecret, redirectUri: callback };
};

export const createDiscordApi = (rawConfig: DiscordApiConfig) => {
  const config = validateConfig(rawConfig);
  const sessions = new Map<string, Session>();
  const secureCookie = config.redirectUri.protocol === "https:";

  const getSession = (request: IncomingMessage) => {
    const sessionId = parseCookies(request.headers.cookie).guild_export_session;
    if (!sessionId || !/^[a-zA-Z0-9_-]{43}$/.test(sessionId)) return null;
    const session = sessions.get(sessionId);
    if (!session || session.expiresAt <= Date.now()) {
      sessions.delete(sessionId);
      return null;
    }
    return { id: sessionId, value: session };
  };

  const cleanup = () => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (session.expiresAt <= now) sessions.delete(id);
    }
  };

  return async (request: IncomingMessage, response: ServerResponse, next?: Next): Promise<void> => {
    const url = new URL(request.url ?? "/", config.appOrigin);
    if (!url.pathname.startsWith("/api/")) {
      next?.();
      return;
    }

    cleanup();
    try {
      if (request.method === "GET" && url.pathname === "/api/auth/login") {
        const id = randomBytes(32).toString("base64url");
        const state = randomBytes(32).toString("base64url");
        sessions.set(id, { expiresAt: Date.now() + sessionTtlMs, state, status: "pending" });
        const authorizeUrl = new URL("https://discord.com/oauth2/authorize");
        authorizeUrl.search = new URLSearchParams({
          response_type: "code",
          client_id: config.clientId,
          scope: "guilds",
          redirect_uri: config.redirectUri.href,
          state,
        }).toString();
        redirect(response, authorizeUrl.href, createCookie(id, secureCookie));
        return;
      }

      if (request.method === "GET" && url.pathname === config.redirectUri.pathname) {
        const session = getSession(request);
        if (!session || url.searchParams.get("state") !== session.value.state) {
          throw new Error("認証セッションを確認できませんでした。最初からやり直してください。");
        }
        const code = url.searchParams.get("code");
        const oauthError = url.searchParams.get("error");
        if (!code) throw new Error(oauthError ?? "Discordから認証コードが返されませんでした。");

        const token = await exchangeCode(config, code);
        if (!isRecord(token) || typeof token.access_token !== "string") {
          throw new Error("Discord APIのトークン応答が不正です。");
        }
        try {
          const guilds = await fetchGuilds(token.access_token);
          sessions.set(session.id, {
            expiresAt: Date.now() + sessionTtlMs,
            state: session.value.state,
            status: "ready",
            guilds,
          });
        } finally {
          await revokeToken(config, token.access_token);
        }
        redirect(response, config.appOrigin.href);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/session") {
        const session = getSession(request);
        if (!session) {
          json(response, 200, { status: "idle" });
          return;
        }
        if (session.value.status === "ready") {
          json(response, 200, { status: "ready", guilds: session.value.guilds });
          return;
        }
        if (session.value.status === "error") {
          json(response, 200, { status: "error", message: session.value.message });
          return;
        }
        json(response, 200, { status: "pending" });
        return;
      }

      if (request.method === "DELETE" && url.pathname === "/api/session") {
        const session = getSession(request);
        if (session) sessions.delete(session.id);
        response.writeHead(204, { "Set-Cookie": clearCookie(secureCookie) });
        response.end();
        return;
      }

      json(response, 404, { message: "Not found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "予期しないエラーが発生しました。";
      const session = getSession(request);
      if (session) {
        sessions.set(session.id, {
          expiresAt: session.value.expiresAt,
          state: session.value.state,
          status: "error",
          message,
        });
      }
      if (url.pathname === config.redirectUri.pathname) {
        redirect(response, config.appOrigin.href);
        return;
      }
      json(response, 500, { status: "error", message });
    }
  };
};
