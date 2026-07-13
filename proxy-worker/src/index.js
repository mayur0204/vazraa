/**
 * Cloudflare Worker — AiSensy Relay Proxy
 *
 * Deployed at: https://aisensy-relay.YOUR-SUBDOMAIN.workers.dev
 *
 * This Worker accepts POST requests from your localhost Spring Boot backend
 * and forwards them to the real AiSensy API at messages.bgsinfotech.com.
 * Cloudflare's edge has unrestricted outbound internet access.
 *
 * Deploy:
 *   cd proxy-worker
 *   npx wrangler deploy
 */

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const TARGET = "https://messages.bgsinfotech.com/messages/whatsapp";

    try {
      const body = await request.text();
      console.log("[Relay] Forwarding payload to AiSensy:", body);

      const upstream = await fetch(TARGET, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: body,
      });

      const responseText = await upstream.text();
      console.log("[Relay] AiSensy response:", upstream.status, responseText);

      return new Response(responseText, {
        status: upstream.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Relay-Target": TARGET,
          "X-Relay-Status": String(upstream.status),
        },
      });
    } catch (err) {
      console.error("[Relay] Error:", err.message);
      return new Response(
        JSON.stringify({
          error: "Relay failed",
          message: err.message,
          target: TARGET,
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
