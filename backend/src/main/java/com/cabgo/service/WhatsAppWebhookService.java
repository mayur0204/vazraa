package com.cabgo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppWebhookService {

    private final ChatSessionService chatSessionService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final com.cabgo.repository.WhatsAppSessionsRepository whatsappSessionsRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Parse the incoming Meta or AISensy WhatsApp API webhook payload and route to state machine.
     */
    public void processWebhookPayload(String payload) {
        log.debug("Received WhatsApp webhook payload: {}", payload);
        try {
            JsonNode root = objectMapper.readTree(payload);
            
            String from = null;
            String type = null;
            String textBody = null;
            Double locationLat = null;
            Double locationLng = null;
            String locationName = null;
            String interactiveReplyId = null;

            // Check if it's an AISensy topic webhook
            if (root.has("topic")) {
                String topic = root.path("topic").asText();
                log.info("Handling AISensy webhook topic: {}", topic);
                
                if ("message.status.updated".equals(topic)) {
                    log.info("AISensy message status updated: {}", payload);
                    return; // Ignore status updates in the chatbot logic
                }
                
                if ("message.sender.user".equals(topic)) {
                    JsonNode data = root.path("data");
                    if (data.isMissingNode()) {
                        log.warn("AISensy message.sender.user webhook is missing 'data' object");
                        return;
                    }
                    
                    // Parse sender phone number with multiple robust fallbacks
                    JsonNode sender = data.path("sender");
                    if (!sender.isMissingNode()) {
                        if (!sender.path("phone_number").isMissingNode()) {
                            from = sender.path("phone_number").asText();
                        } else if (!sender.path("phone").isMissingNode()) {
                            from = sender.path("phone").asText();
                        } else {
                            from = sender.path("id").asText();
                        }
                    } else {
                        // Fallback: check direct fields in data
                        if (!data.path("phone").isMissingNode()) {
                            from = data.path("phone").asText();
                        } else if (!data.path("phone_number").isMissingNode()) {
                            from = data.path("phone_number").asText();
                        } else if (!data.path("from").isMissingNode()) {
                            from = data.path("from").asText();
                        }
                    }
                    
                    type = data.path("type").asText();
                    log.info("[Webhook Extractor] Extracted from: {}, type: {}", from, type);
                    
                    if ("text".equals(type)) {
                        JsonNode bodyNode = data.path("body");
                        if (bodyNode.isObject() && !bodyNode.path("text").isMissingNode()) {
                            textBody = bodyNode.path("text").asText();
                        } else if (!data.path("text").path("body").isMissingNode()) {
                            textBody = data.path("text").path("body").asText();
                        } else if (!data.path("text").isMissingNode() && data.path("text").isTextual()) {
                            textBody = data.path("text").asText();
                        } else if (!data.path("body").isMissingNode()) {
                            textBody = data.path("body").isObject() 
                                    ? data.path("body").path("text").asText() 
                                    : data.path("body").asText();
                        }
                        log.info("[Webhook Extractor] Extracted text body: {}", textBody);
                    } else if ("location".equals(type)) {
                        JsonNode loc = data.path("location").isMissingNode() 
                                ? data.path("body").path("location") 
                                : data.path("location");
                        if (!loc.isMissingNode()) {
                            locationLat = loc.path("latitude").asDouble();
                            locationLng = loc.path("longitude").asDouble();
                            locationName = loc.path("name").asText();
                            if (locationName == null || locationName.isEmpty()) {
                                locationName = loc.path("address").asText();
                            }
                        }
                        log.info("[Webhook Extractor] Extracted location: lat={}, lng={}, name={}", locationLat, locationLng, locationName);
                    } else if ("interactive".equals(type)) {
                        JsonNode interactive = data.path("interactive").isMissingNode() 
                                ? data.path("body").path("interactive") 
                                : data.path("interactive");
                        if (!interactive.isMissingNode()) {
                            String interactiveType = interactive.path("type").asText();
                            if ("button_reply".equals(interactiveType)) {
                                JsonNode reply = interactive.path("button_reply");
                                interactiveReplyId = reply.path("id").asText();
                                textBody = reply.path("title").asText();
                            } else if ("list_reply".equals(interactiveType)) {
                                JsonNode reply = interactive.path("list_reply");
                                interactiveReplyId = reply.path("id").asText();
                                textBody = reply.path("title").asText();
                            }
                        } else {
                            JsonNode reply = data.path("button_reply").isMissingNode() 
                                    ? data.path("list_reply") 
                                    : data.path("button_reply");
                            if (!reply.isMissingNode()) {
                                interactiveReplyId = reply.path("id").asText();
                                textBody = reply.path("title").asText();
                            }
                        }
                        log.info("[Webhook Extractor] Extracted interactive reply: id={}, text={}", interactiveReplyId, textBody);
                    } else if ("button".equals(type) || "button_reply".equals(type)) {
                        JsonNode reply = data.path("button_reply").isMissingNode() 
                                ? data.path("button") 
                                : data.path("button_reply");
                        if (!reply.isMissingNode()) {
                            interactiveReplyId = reply.path("id").asText();
                            textBody = reply.path("text").isMissingNode() 
                                    ? reply.path("title").asText() 
                                    : reply.path("text").asText();
                        }
                        log.info("[Webhook Extractor] Extracted button reply: id={}, text={}", interactiveReplyId, textBody);
                    } else if ("list".equals(type) || "list_reply".equals(type)) {
                        JsonNode reply = data.path("list_reply").isMissingNode() 
                                ? data.path("list") 
                                : data.path("list_reply");
                        if (!reply.isMissingNode()) {
                            interactiveReplyId = reply.path("id").asText();
                            textBody = reply.path("title").isMissingNode() 
                                    ? reply.path("description").asText() 
                                    : reply.path("title").asText();
                        }
                        log.info("[Webhook Extractor] Extracted list reply: id={}, text={}", interactiveReplyId, textBody);
                    } else if ("image".equals(type)) {
                        JsonNode img = data.path("image").isMissingNode() 
                                ? data.path("body").path("image") 
                                : data.path("image");
                        if (!img.isMissingNode()) {
                            textBody = img.path("url").asText();
                            if (textBody == null || textBody.isEmpty()) {
                                textBody = img.path("id").asText();
                            }
                        }
                        log.info("[Webhook Extractor] Extracted image URL/ID: {}", textBody);
                    } else if ("document".equals(type)) {
                        JsonNode doc = data.path("document").isMissingNode() 
                                ? data.path("body").path("document") 
                                : data.path("document");
                        if (!doc.isMissingNode()) {
                            textBody = doc.path("url").asText();
                            if (textBody == null || textBody.isEmpty()) {
                                textBody = doc.path("id").asText();
                            }
                        }
                        log.info("[Webhook Extractor] Extracted document URL/ID: {}", textBody);
                    }
                } else {
                    log.info("Ignoring unhandled AISensy topic: {}", topic);
                    return;
                }
            } else {
                // Fallback: Parse standard Meta WhatsApp format
                JsonNode entry = root.path("entry").get(0);
                if (entry == null) return;

                JsonNode change = entry.path("changes").get(0);
                if (change == null) return;

                JsonNode value = change.path("value");
                if (value == null) return;

                // Check if there are messages
                JsonNode messages = value.path("messages");
                if (messages.isMissingNode() || messages.size() == 0) {
                    log.debug("No messages in webhook payload (likely a status update)");
                    return;
                }

                JsonNode message = messages.get(0);
                from = message.path("from").asText();
                type = message.path("type").asText();

                if ("text".equals(type)) {
                    textBody = message.path("text").path("body").asText();
                } else if ("location".equals(type)) {
                    JsonNode loc = message.path("location");
                    locationLat = loc.path("latitude").asDouble();
                    locationLng = loc.path("longitude").asDouble();
                    locationName = loc.path("name").asText();
                    if (locationName == null || locationName.isEmpty()) {
                        locationName = loc.path("address").asText();
                    }
                } else if ("interactive".equals(type)) {
                    JsonNode interactive = message.path("interactive");
                    String interactiveType = interactive.path("type").asText();
                    if ("button_reply".equals(interactiveType)) {
                        JsonNode reply = interactive.path("button_reply");
                        interactiveReplyId = reply.path("id").asText();
                        textBody = reply.path("title").asText();
                    } else if ("list_reply".equals(interactiveType)) {
                        JsonNode reply = interactive.path("list_reply");
                        interactiveReplyId = reply.path("id").asText();
                        textBody = reply.path("title").asText();
                    }
                } else if ("image".equals(type)) {
                    JsonNode img = message.path("image");
                    textBody = img.path("url").asText();
                    if (textBody == null || textBody.isEmpty()) {
                        textBody = img.path("id").asText();
                    }
                }
            }

            if (from == null || type == null) {
                log.warn("Webhook payload could not be parsed: from={}, type={}", from, type);
                return;
            }

            // Save to historical log (WhatsAppSessions)
            try {
                com.cabgo.model.WhatsAppSessions logEntry = com.cabgo.model.WhatsAppSessions.builder()
                        .whatsappPhone(from)
                        .direction("INCOMING")
                        .messageType(type)
                        .content(textBody != null ? textBody : (interactiveReplyId != null ? interactiveReplyId : ""))
                        .timestamp(java.time.LocalDateTime.now())
                        .build();
                whatsappSessionsRepository.save(logEntry);
            } catch (Exception logEx) {
                log.error("Failed to archive incoming WhatsApp message", logEx);
            }

            log.info("Processing message from: {}, type: {}, body/id: {}", from, type, 
                interactiveReplyId != null ? interactiveReplyId : textBody);

            // Broadcast incoming message to WebSocket for live admin monitor
            try {
                java.util.Map<String, Object> wsMsg = java.util.Map.of(
                    "direction", "incoming",
                    "from", from,
                    "type", type,
                    "textBody", textBody != null ? textBody : (interactiveReplyId != null ? interactiveReplyId : ""),
                    "timestamp", System.currentTimeMillis()
                );
                messagingTemplate.convertAndSend("/topic/admin/whatsapp", wsMsg);
            } catch (Exception wsEx) {
                log.error("Failed to broadcast incoming WhatsApp message", wsEx);
            }

            chatSessionService.handleMessage(
                from, 
                type, 
                textBody, 
                locationLat, 
                locationLng, 
                locationName, 
                interactiveReplyId
            );


        } catch (Exception e) {
            log.error("Failed to parse WhatsApp webhook payload", e);
        }
    }
}
