import { computed, onMounted, readonly, ref } from "vue";
import type { GuildSession } from "./guild";
import { filterGuilds, parseGuildSession, serializeGuilds } from "./guild";

export function useGuildExporter() {
  const session = ref<GuildSession>({ status: "pending" });
  const query = ref("");
  const guilds = computed(() => (session.value.status === "ready" ? session.value.guilds : []));
  const filteredGuilds = computed(() => filterGuilds(guilds.value, query.value));

  async function loadSession() {
    session.value = { status: "pending" };
    try {
      const response = await fetch("/api/session", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      session.value = parseGuildSession(await response.json());
    } catch {
      session.value = {
        status: "error",
        message: "状態を取得できませんでした。時間をおいて、もう一度お試しください。",
      };
    }
  }

  function connect() {
    window.location.assign("/api/auth/login");
  }

  function download() {
    if (session.value.status !== "ready") return;
    const blob = new Blob([serializeGuilds(session.value.guilds)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "discord-servers.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function clear() {
    await fetch("/api/session", { method: "DELETE" });
    query.value = "";
    session.value = { status: "idle" };
  }

  onMounted(loadSession);

  return {
    session: readonly(session),
    query,
    guilds,
    filteredGuilds,
    connect,
    download,
    clear,
    loadSession,
  };
}
