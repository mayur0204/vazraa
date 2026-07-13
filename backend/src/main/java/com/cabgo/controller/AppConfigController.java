package com.cabgo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Exposes non-sensitive application configuration values to the frontend.
 * This allows the WhatsApp business number (and similar settings) to be
 * loaded at runtime rather than hardcoded in the React bundle.
 *
 * GET /api/config/public
 */
@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
public class AppConfigController {

    @Value("${aisensy.whatsapp-number:919035999800}")
    private String whatsappNumber;

    /**
     * Returns public-safe configuration values that the frontend widgets need.
     * No authentication required — these are intentionally non-sensitive values.
     */
    @GetMapping("/public")
    public ResponseEntity<Map<String, String>> getPublicConfig() {
        // Format: strip leading country-code "91" for display, keep full number for wa.me link
        String formattedNumber = whatsappNumber.startsWith("91")
                ? "+" + whatsappNumber
                : whatsappNumber;

        return ResponseEntity.ok(Map.of(
            "whatsappNumber", formattedNumber,
            "whatsappLink",   "https://wa.me/" + whatsappNumber,
            "supportEmail",   "support@vazraamobility.com",
            "brandName",      "Vazraa Mobility"
        ));
    }
}
