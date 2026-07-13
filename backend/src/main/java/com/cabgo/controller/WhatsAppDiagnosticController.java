package com.cabgo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.RequestBody;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * POST /api/webhook/diagnose
 *
 * Fires a live diagnostic through every layer of the WhatsApp pipeline
 * and returns a structured JSON report with pass/fail per layer and the
 * exact root cause if something fails.
 *
 * Also exposes:
 *   POST /api/webhook/simulate  — identical to /api/webhook/whatsapp but
 *                                 runs synchronously so you see the full
 *                                 AiSensy response before the HTTP reply.
 */
@Slf4j
@RestController
@RequestMapping("/webhook")
@RequiredArgsConstructor
public class WhatsAppDiagnosticController {

    @Value("${aisensy.message-api-url}")
    private String apiUrl;

    @Value("${aisensy.api-key}")
    private String apiKey;

    @Value("${aisensy.campaign-name}")
    private String campaignName;

    @Value("${aisensy.user-name:Vazra mobility}")
    private String userName;

    @Value("${aisensy.whatsapp-number}")
    private String whatsappNumber;

    private final com.cabgo.service.WhatsAppWebhookService webhookService;
    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(20, java.util.concurrent.TimeUnit.SECONDS)
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/webhook/diagnose
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/diagnose")
    public ResponseEntity<Map<String, Object>> diagnose(
            @org.springframework.web.bind.annotation.RequestBody(required = false) String rawBody) {

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("timestamp", java.time.LocalDateTime.now().toString());

        // ── Layer 1: Config ──────────────────────────────────────────────────
        Map<String, Object> configLayer = new LinkedHashMap<>();
        configLayer.put("aisensy_api_url",      apiUrl);
        configLayer.put("aisensy_api_key",       maskKey(apiKey));
        configLayer.put("aisensy_campaign_name", campaignName);
        configLayer.put("aisensy_user_name",     userName);
        configLayer.put("business_whatsapp",     whatsappNumber);
        boolean configOk = apiKey != null && !apiKey.isEmpty()
                && campaignName != null && !campaignName.isEmpty()
                && apiUrl != null && apiUrl.startsWith("http");
        configLayer.put("status",  configOk ? "PASS" : "FAIL");
        configLayer.put("note",    configOk
                ? "All required config values are present."
                : "One or more config values are missing. Check application.yml / .env.");
        report.put("layer_1_config", configLayer);

        // ── Layer 2: Webhook Parsing ─────────────────────────────────────────
        Map<String, Object> parseLayer = new LinkedHashMap<>();
        String testPayload = rawBody != null && !rawBody.isBlank() ? rawBody :
                "{\"topic\":\"message.sender.user\",\"data\":{\"sender\":{\"phone\":\"" + whatsappNumber
                + "\"},\"type\":\"text\",\"text\":{\"body\":\"Hi\"}}}";
        parseLayer.put("payload_used", testPayload);
        boolean parseOk = false;
        String parsedPhone = null;
        String parsedType  = null;
        String parsedText  = null;
        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(testPayload);
            if (root.has("topic") && "message.sender.user".equals(root.path("topic").asText())) {
                com.fasterxml.jackson.databind.JsonNode data   = root.path("data");
                com.fasterxml.jackson.databind.JsonNode sender = data.path("sender");
                parsedPhone = !sender.path("phone").isMissingNode()
                        ? sender.path("phone").asText()
                        : data.path("phone").asText();
                parsedType  = data.path("type").asText();
                parsedText  = data.path("text").path("body").asText();
                parseOk = parsedPhone != null && !parsedPhone.isEmpty();
            }
        } catch (Exception ex) {
            parseLayer.put("error", ex.getMessage());
        }
        parseLayer.put("parsed_from",      parsedPhone);
        parseLayer.put("parsed_type",      parsedType);
        parseLayer.put("parsed_text_body", parsedText);
        parseLayer.put("status", parseOk ? "PASS" : "FAIL");
        parseLayer.put("note",   parseOk
                ? "Webhook payload parsed successfully."
                : "Could not extract phone / type from payload. Check field names.");
        report.put("layer_2_webhook_parsing", parseLayer);

        // ── Layer 3: AiSensy Connectivity (raw TCP) ──────────────────────────
        Map<String, Object> connLayer = new LinkedHashMap<>();
        boolean connOk = false;
        try {
            Request ping = new Request.Builder()
                    .url(apiUrl)
                    .head()
                    .build();
            try (Response pingResp = httpClient.newCall(ping).execute()) {
                connOk = true;   // any HTTP response = TCP reachable
                connLayer.put("http_status", pingResp.code());
            }
        } catch (Exception ex) {
            connLayer.put("error", ex.getMessage());
            connLayer.put("hint",  "Possible causes: no internet, firewall, VPN, DNS failure.");
        }
        connLayer.put("url",    apiUrl);
        connLayer.put("status", connOk ? "PASS" : "FAIL");
        report.put("layer_3_aisensy_connectivity", connLayer);

        // ── Layer 4: AiSensy API — Real Send ────────────────────────────────
        Map<String, Object> sendLayer = new LinkedHashMap<>();
        String deliveryPhone = parsedPhone != null ? parsedPhone : whatsappNumber;
        boolean sendOk = false;
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("apiKey",         apiKey);
            body.put("campaignName",   campaignName);
            body.put("destination",    normalizePhone(deliveryPhone));
            body.put("userName",       userName);
            body.put("templateParams", List.of("Welcome to *Vazra Cab Booking*! 🎉\n\nHow can we help you today?\n1️⃣ *Book a Ride*\n2️⃣ *View Ride History*\n3️⃣ *Cancel Ride*\n4️⃣ *Support / Help*\n\nReply with 1-4 to proceed."));
            body.put("source",         "api");
            body.put("media",          Map.of());
            body.put("buttons",        List.of());
            body.put("carouselCards",  List.of());
            body.put("location",       Map.of());

            String json = objectMapper.writeValueAsString(body);
            sendLayer.put("outgoing_payload", body);

            Request req = new Request.Builder()
                    .url(apiUrl)
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(json, JSON))
                    .build();

            try (Response resp = httpClient.newCall(req).execute()) {
                int code      = resp.code();
                String respBody = resp.body() != null ? resp.body().string() : "(no body)";
                sendLayer.put("http_status",    code);
                sendLayer.put("response_body",  respBody);
                sendOk = resp.isSuccessful();
                sendLayer.put("status", sendOk ? "PASS" : "FAIL");

                if (!sendOk) {
                    sendLayer.put("root_cause", diagnoseAiSensyError(code, respBody));
                } else {
                    sendLayer.put("note", "Message dispatched to AiSensy. Customer should receive it within seconds.");
                }
            }
        } catch (Exception ex) {
            sendLayer.put("status",     "FAIL");
            sendLayer.put("error",      ex.getClass().getSimpleName() + ": " + ex.getMessage());
            sendLayer.put("root_cause", diagnoseException(ex));
        }
        report.put("layer_4_aisensy_send", sendLayer);

        // ── Summary ──────────────────────────────────────────────────────────
        boolean allPass = configOk && parseOk && sendOk;
        report.put("overall_status", allPass ? "ALL_PASS" : "HAS_FAILURES");
        report.put("delivery_expected_to", normalizePhone(deliveryPhone));

        log.info("[DIAGNOSE] Report: {}", report);
        return ResponseEntity.ok(report);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/webhook/simulate
    // Runs the full chatbot pipeline SYNCHRONOUSLY so you can see the AiSensy
    // response in the same HTTP reply (unlike /api/webhook/whatsapp which is async).
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulate(
            @org.springframework.web.bind.annotation.RequestBody(required = false) String rawBody) {

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timestamp", java.time.LocalDateTime.now().toString());

        String payload = rawBody != null && !rawBody.isBlank() ? rawBody :
                "{\"topic\":\"message.sender.user\",\"data\":{\"sender\":{\"phone\":\""
                + whatsappNumber + "\"},\"type\":\"text\",\"text\":{\"body\":\"Hi\"}}}";

        result.put("payload_used", payload);

        try {
            log.info("[SIMULATE] Running synchronous webhook pipeline...");
            webhookService.processWebhookPayload(payload);
            result.put("status", "SUCCESS");
            result.put("note",   "Pipeline completed. Check AiSensy dashboard / customer WhatsApp for the message.");
        } catch (Exception ex) {
            result.put("status",     "FAILED");
            result.put("error",      ex.getMessage());
            result.put("root_cause", diagnoseException(ex));
            log.error("[SIMULATE] Pipeline error", ex);
        }

        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        String clean = phone.replaceAll("[^0-9]", "");
        return clean.length() == 10 ? "91" + clean : clean;
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 8) return "***";
        return key.substring(0, 4) + "****" + key.substring(key.length() - 4);
    }

    private String diagnoseAiSensyError(int httpCode, String body) {
        String b = body.toLowerCase();
        if (httpCode == 401 || b.contains("unauthorized") || b.contains("invalid api key") || b.contains("apikey")) {
            return "AUTHENTICATION_FAILURE — The API key is wrong or inactive. " +
                   "Log in to AiSensy / bgsinfotech dashboard and copy the live API key.";
        }
        if (httpCode == 403) {
            return "FORBIDDEN — Account may be suspended or IP not whitelisted.";
        }
        if (httpCode == 400 && b.contains("template")) {
            return "INVALID_TEMPLATE — The campaign name does not match an approved template. " +
                   "Check campaign name spelling in AiSensy dashboard.";
        }
        if (httpCode == 400 && (b.contains("destination") || b.contains("phone"))) {
            return "INVALID_PHONE_NUMBER — Destination phone format rejected. " +
                   "Must be 91XXXXXXXXXX (country code + 10 digits, no +).";
        }
        if (httpCode == 400 && b.contains("session")) {
            return "SESSION_WINDOW_CLOSED — Customer has not messaged your WhatsApp number in the last 24 hours. " +
                   "They need to initiate the conversation first (send any message to your WhatsApp Business number).";
        }
        if (httpCode == 429) {
            return "RATE_LIMITED — Too many requests. Wait and retry.";
        }
        if (httpCode >= 500) {
            return "AISENSY_SERVER_ERROR — bgsinfotech servers are down. Check their status page.";
        }
        return "UNKNOWN_ERROR — HTTP " + httpCode + " — Raw body: " + body;
    }

    private String diagnoseException(Exception ex) {
        String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        if (msg.contains("connect") || msg.contains("connection refused") || msg.contains("no route")) {
            return "NETWORK_ERROR — Cannot reach " + apiUrl + ". " +
                   "This machine may have no outbound internet access (behind a firewall/VPN/proxy). " +
                   "Try: curl -I https://messages.bgsinfotech.com from the same machine.";
        }
        if (msg.contains("timeout") || msg.contains("timed out")) {
            return "TIMEOUT — AiSensy server did not respond within 20 seconds.";
        }
        if (msg.contains("ssl") || msg.contains("certificate") || msg.contains("handshake")) {
            return "SSL_ERROR — TLS handshake failed. Check system trust store or proxy SSL interception.";
        }
        if (msg.contains("unknown host") || msg.contains("dns")) {
            return "DNS_FAILURE — Cannot resolve messages.bgsinfotech.com. Check DNS settings.";
        }
        return "EXCEPTION — " + ex.getClass().getSimpleName() + ": " + ex.getMessage();
    }
}
