package com.cabgo.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Mock controller that acts as the AiSensy Campaign Message API.
 * This resolves outgoing Connection Refused errors during local testing
 * by capturing the outbound POST requests, logging their contents, and returning HTTP 200.
 *
 * Configured in local .env as:
 * AISENSY_MESSAGE_API_URL=http://localhost:8080/api/mock/aisensy
 */
@Slf4j
@RestController
@RequestMapping("/mock/aisensy")
public class AiSensyMockController {

    @PostMapping
    public ResponseEntity<Map<String, Object>> mockSendMessage(@RequestBody Map<String, Object> payload) {
        log.info("=== [MOCK AISENSY MESSAGE RECEIVER] ===");
        log.info("Destination   : {}", payload.get("destination"));
        log.info("Campaign Name : {}", payload.get("campaignName"));
        log.info("User Name     : {}", payload.get("userName"));
        log.info("Template Args : {}", payload.get("templateParams"));
        log.info("Source        : {}", payload.get("source"));
        log.info("=========================================");

        return ResponseEntity.ok(Map.of(
            "success", true,
            "status", "SUCCESS",
            "messageId", "mock-msg-" + java.util.UUID.randomUUID().toString(),
            "message", "Message processed successfully by local mock server"
        ));
    }
}
