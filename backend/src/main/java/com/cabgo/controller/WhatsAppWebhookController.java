package com.cabgo.controller;

import com.cabgo.service.WhatsAppWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Enumeration;

/**
 * Webhook endpoint for AiSensy (bgsinfotech reseller).
 *
 * GET  /api/messages/whatsapp  — webhook verification ping from AiSensy dashboard
 * POST /api/messages/whatsapp  — incoming message events
 *
 * This matches the yot chatbot setup which was already verified working.
 */
@Slf4j
@RestController
@RequestMapping("/messages/whatsapp")
@RequiredArgsConstructor
public class WhatsAppWebhookController {

    private final WhatsAppWebhookService webhookService;

    /**
     * AiSensy pings this with a GET before activating the webhook.
     * Log all query params so we can see what AiSensy sends during verification.
     */
    @GetMapping
    public ResponseEntity<String> verifyWebhook(HttpServletRequest request) {
        StringBuilder params = new StringBuilder("AiSensy webhook verification GET — query params: ");
        Enumeration<String> names = request.getParameterNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            params.append(name).append("=").append(request.getParameter(name)).append(" | ");
        }
        log.info(params.toString());
        return ResponseEntity.ok("OK");
    }

    /**
     * Test endpoint for Postman debugging.
     * Use GET https://messages.bgsinfotech.com/messages/whatsapp/test
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        log.info("=== TEST ENDPOINT HIT FROM POSTMAN ===");
        return ResponseEntity.ok("VAZRAA_BACKEND_IS_RUNNING");
    }

    /**
     * Receives incoming WhatsApp message events from AiSensy.
     *
     * Phase 1 (active): Logs the raw body at INFO so Railway logs reveal the
     *   exact JSON field names AiSensy uses, then delegates to webhookService.
     *
     * Always returns 200 immediately so AiSensy does not retry delivery.
     */
    @PostMapping
    public ResponseEntity<Void> receiveMessage(
            @RequestBody(required = false) String requestBody,
            HttpServletRequest request) {

        if (requestBody == null || requestBody.trim().isEmpty()) {
            log.warn("Received empty webhook payload from {}", request.getRemoteAddr());
            return ResponseEntity.ok().build();
        }

        log.info("=== Incoming Webhook Received ===");
        log.info("Content-Type : {}", request.getContentType());
        log.info("Payload      : {}", requestBody);

        // Process asynchronously to return HTTP 200 immediately
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                log.info("Starting async processing of webhook payload...");
                webhookService.processWebhookPayload(requestBody);
                log.info("Completed async processing of webhook payload.");
            } catch (Exception e) {
                log.error("Exception during async webhook processing", e);
            }
        });

        log.info("Returning HTTP 200 to webhook caller immediately.");
        return ResponseEntity.ok().build();
    }
}
