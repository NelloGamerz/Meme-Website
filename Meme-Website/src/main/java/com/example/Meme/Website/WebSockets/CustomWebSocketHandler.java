package com.example.Meme.Website.WebSockets;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import com.example.Meme.Website.config.RateLimitConfig;
import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.services.ProfileService;
import com.example.Meme.Website.services.RateLimiterService;
import com.example.Meme.Website.services.memeService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
@Component
public class CustomWebSocketHandler implements WebSocketHandler {

    private final memeService memeService;
    private final ProfileService profileService;
    private final WebSocketSessionManager webSocketSessionManager;
    private final RateLimiterService rateLimiterService;
    private final RateLimitConfig rateLimitConfig;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public CustomWebSocketHandler(memeService memeService,
                                  ProfileService profileService,
                                  WebSocketSessionManager webSocketSessionManager,
                                  RateLimiterService rateLimiterService,
                                  RateLimitConfig rateLimitConfig) {
        this.memeService = memeService;
        this.profileService = profileService;
        this.webSocketSessionManager = webSocketSessionManager;
        this.rateLimiterService = rateLimiterService;
        this.rateLimitConfig = rateLimitConfig;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Map<String, Object> attributes = session.getAttributes();
        String username = (String) attributes.get("username");

        if (username != null) {
            WebSocketSessionManager.registerUserSession(username, session);
        } else {
            System.out.println("Guest user Connected");
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws IOException {
        JsonNode json = objectMapper.readTree(message.getPayload().toString());

        String type = json.get("type").asText();
        Map<String, Object> attributes = session.getAttributes();
        String username = (String) attributes.get("username");
        boolean isGuest = Boolean.TRUE.equals(attributes.get("isGuest"));
        String clientKey;

        if (attributes.containsKey("userId")) {
            clientKey = "user:" + attributes.get("userId");
        } else {
            String ip = session.getRemoteAddress() != null
                    ? session.getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            clientKey = "ip:" + ip;
        }

        String bucketType = mapTypeToBucketType(type);

        if (!rateLimiterService.isAllowed(bucketType, clientKey)) {
            long retryAfter = rateLimiterService.getRetryAfter(bucketType, clientKey);
            session.sendMessage(new TextMessage(
                    "{\"error\": \"RATE_LIMIT_EXCEEDED\", \"retryAfter\": " + retryAfter + "}"));
            return;
        }

        switch (type) {
            case "LIKE":
            case "SAVE":
            case "COMMENT":
            case "FOLLOW":
                if (isGuest) {
                    session.sendMessage(new TextMessage("{\"error\": \"LOGIN_REQUIRED\"}"));
                    return;
                }
                break;
            default:
        }

        switch (type) {
            case "JOIN_POST":
                webSocketSessionManager.registerPostSession(json.get("postId").asText(), session);
                break;

            case "LEAVE_POST":
                webSocketSessionManager.removePostSession(json.get("postId").asText(), session);
                break;

            case "LIKE":
                handleLikeEvent(json, username);
                break;

            case "SAVE":
                handleSaveEvent(json, username);
                break;

            case "COMMENT":
                handleCommentEvent(json, session, username);
                break;

            case "FOLLOW":
                handleFollowEvent(json);
                break;

            default:
                session.sendMessage(new TextMessage("{\"error\":\"Unknown type: " + type + "\"}"));
        }
    }

    private String mapTypeToBucketType(String type) {
        return switch (type) {
            case "COMMENT" -> "ws:comment";
            case "LIKE" -> "ws:like";
            case "SAVE" -> "ws:save";
            case "JOIN_POST", "LEAVE_POST" -> "ws:session";
            case "FOLLOW" -> "ws:follow";
            default -> "ws:default";
        };
    }
    private void handleCommentEvent(JsonNode json, WebSocketSession session, String username) throws IOException {
        Comments comment = new Comments();

        comment.setMemeId(json.get("memeId").asText());
        comment.setText(json.get("text").asText());

        String commentUserId =  (String) session.getAttributes().get("userId");
        comment.setUserId(commentUserId);
        comment.setUsername(username);
        String profilePictureUrl = json.has("profilePictureUrl")
                ? json.get("profilePictureUrl").asText()
                : null;
        comment.setProfilePictureUrl(profilePictureUrl);
        comment.setCreatedAt(new Date());

        memeService.addCommentsToMeme(comment);

        System.out.println("💬 New comment added by: " + username + " on memeId: " + comment.getMemeId());
    }

    private void handleFollowEvent(JsonNode json) throws IOException {
        String followerUsername = json.get("followerUsername").asText();
        String followingUsername = json.get("followingUsername").asText();
        boolean isFollowing = json.has("isFollowing") && json.get("isFollowing").asBoolean();

        Map<String, Boolean> requestBody = new HashMap<>();
        requestBody.put("isFollowing", isFollowing);

        ResponseEntity<?> followResponse = profileService.followUserByUsername(
                followerUsername, followingUsername, requestBody);

        ObjectNode followPayload = objectMapper.createObjectNode();
        followPayload.put("type", "FOLLOW");
        followPayload.put("followerUsername", followerUsername);
        followPayload.put("followingUsername", followingUsername);
        followPayload.put("isFollowing", isFollowing);
        followPayload.put("status", followResponse.getStatusCode().value());
        followPayload.put("message", followResponse.getBody().toString());

        String payload = objectMapper.writeValueAsString(followPayload);
        WebSocketSessionManager.sendToUser(followerUsername, payload);

        System.out.println("🔁 Sent FOLLOW response to " + followerUsername);
    }

    private void handleLikeEvent(JsonNode json, String username) throws IOException {
        String memeId = json.get("memeId").asText();
        String action = json.get("action").asText();
        boolean isLike = action.equalsIgnoreCase("LIKE");

        ResponseEntity<?> response = memeService.likedMemes(username, memeId, isLike);
        ObjectNode likePayload = objectMapper.createObjectNode();
        likePayload.put("type", "LIKE");
        likePayload.put("memeId", memeId);
        likePayload.put("username", username);
        likePayload.put("action", action);
        likePayload.put("status", response.getStatusCode().value());

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof JsonNode) {
            JsonNode responseBody = (JsonNode) response.getBody();
            likePayload.put("message", responseBody.get("message").asText());
            likePayload.put("likeCount", responseBody.get("likeCount").asInt());
        } else {
            likePayload.put("message", response.getBody().toString());
        }

        String payload = objectMapper.writeValueAsString(likePayload);
        System.out.println("Broadcast payload: " + payload);

        WebSocketSessionManager.broadcastToPost(memeId, payload);
        System.out.println("Broadcasted LIKE event to post viewers of memeId: " + memeId);
    }

    private void handleSaveEvent(JsonNode json, String username) throws IOException {
        String memeId = json.get("memeId").asText();
        boolean isSave = json.get("action").asText().equalsIgnoreCase("SAVE");

        ResponseEntity<?> response = memeService.saveMeme(username, memeId, isSave);
        System.out.println("Service response - status: " + response.getStatusCode() + ", body: " + response.getBody());

        ObjectNode savePayload = objectMapper.createObjectNode();
        savePayload.put("type", "SAVE");
        savePayload.put("memeId", memeId);
        savePayload.put("username", username);
        savePayload.put("action", isSave ? "SAVE" : "UNSAVE");
        savePayload.put("status", response.getStatusCode().value());

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof JsonNode) {
            JsonNode responseBody = (JsonNode) response.getBody();
            savePayload.put("message", responseBody.get("message").asText());
            savePayload.put("saveCount", responseBody.get("saveCount").asInt());
        } else {
            savePayload.put("message", response.getBody().toString());
        }

        String payload = objectMapper.writeValueAsString(savePayload);
        WebSocketSessionManager.broadcastToPost(memeId, payload);
        System.out.println("Broadcasted SAVE event to post viewers of memeId: " + memeId);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        WebSocketSessionManager.removeSessions(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        WebSocketSessionManager.removeSessions(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}
