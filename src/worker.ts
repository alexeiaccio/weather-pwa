/// <reference types="@cloudflare/workers-types" />
/**
 * Weather PWA static-site Worker.
 *
 * Re-serves the built `dist/` (bound as ASSETS, SPA fallback to /index.html
 * handled by `not_found_handling` in wrangler.toml). Stateless passthrough: no
 * routes, no logic, no storage — weather data is fetched client-side from
 * Open-Meteo and cached in IndexedDB (W7 blueprint).
 */
export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
    return env.ASSETS.fetch(request)
  },
}
