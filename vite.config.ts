import vue from "@vitejs/plugin-vue";
import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";
import { createDiscordApi } from "./server/api.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appOrigin = env.APP_ORIGIN ?? "http://localhost:5173";

  return {
    staged: {
      "*": "vp check --fix",
    },
    fmt: {},
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
    plugins: lazyPlugins(() => [
      vue(),
      {
        name: "discord-api",
        configureServer(server) {
          const api = createDiscordApi({
            appOrigin,
            clientId: env.DISCORD_CLIENT_ID,
            clientSecret: env.DISCORD_CLIENT_SECRET,
            redirectUri: env.DISCORD_REDIRECT_URI ?? `${appOrigin}/api/auth/callback`,
          });
          server.middlewares.use(api);
        },
      },
    ]),
  };
});
