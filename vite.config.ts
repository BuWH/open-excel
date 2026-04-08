import react from "@vitejs/plugin-react";
import { getHttpsServerOptions } from "office-addin-dev-certs";
import { defineConfig, loadEnv } from "vite";

function parseUpstreamUrl(rawValue: string) {
  const url = new URL(rawValue);

  return {
    origin: url.origin,
    pathname: url.pathname.replace(/\/+$/, ""),
  };
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const httpsOptions = await getHttpsServerOptions();
  const { LITELLM_UPSTREAM_URL } = env;
  const upstream = parseUpstreamUrl(LITELLM_UPSTREAM_URL ?? "http://127.0.0.1:4000");

  return {
    plugins: [react()],
    server: {
      host: "localhost",
      https: httpsOptions,
      port: 5173,
      proxy: {
        "/api/litellm": {
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/litellm/, upstream.pathname),
          secure: false,
          target: upstream.origin,
        },
        "/api/github": {
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/github/, ""),
          secure: false,
          target: "https://github.com",
        },
        "/api/github-api": {
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/github-api/, ""),
          secure: false,
          target: "https://api.github.com",
        },
        "/api/copilot": {
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/copilot/, ""),
          secure: false,
          target: "https://api.individual.githubcopilot.com",
        },
      },
    },
    preview: {
      host: "localhost",
      https: httpsOptions,
      port: 4173,
    },
  };
});
