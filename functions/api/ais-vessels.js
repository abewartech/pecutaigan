// Cloudflare Pages Function: GET /api/ais-vessels
// Proxies vessel positions from the AIS aggregator server.
//
// Setup (Cloudflare Pages dashboard → Settings → Environment variables):
//   AIS_BASE_URL     e.g. https://ais.example.com  (public HTTPS endpoint of the AIS server)
//   AIS_VESSELS_PATH e.g. /api/vessels               (endpoint on that server returning vessel JSON)
//
// Notes:
// - The AIS server must be reachable over PUBLIC HTTPS. A private IP
//   (e.g. 10.x.x.x) cannot be reached from Cloudflare's edge, and browsers
//   block mixed-content http:// fetches from an HTTPS page. Expose the AIS
//   server via Cloudflare Tunnel / reverse proxy, then set AIS_BASE_URL.
// - The response is passed through as-is; the map page normalizes common
//   field names (mmsi/name/lat/lon/sog/cog/heading/destination/eta/station).

const DEFAULT_PATH = "/api/vessels";

export async function onRequestGet(context) {
  const base = (context.env.AIS_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    return Response.json(
      { error: "ais_not_configured", hint: "Set AIS_BASE_URL in Pages env vars" },
      { status: 503 }
    );
  }
  const path = context.env.AIS_VESSELS_PATH || DEFAULT_PATH;
  let upstream;
  try {
    upstream = await fetch(base + path, {
      headers: { Accept: "application/json" },
      // Keep responses fresh — vessel positions go stale fast.
      cf: { cacheTtl: 0 },
    });
  } catch (err) {
    return Response.json(
      { error: "ais_upstream_unreachable", detail: String(err && err.message || err) },
      { status: 502 }
    );
  }
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}
