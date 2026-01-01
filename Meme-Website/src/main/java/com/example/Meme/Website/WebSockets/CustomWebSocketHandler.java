package com.example.Meme.Website.WebSockets;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import com.example.Meme.Website.config.RateLimitConfig;
import com.example.Meme.Website.dto.ChatMessageResponse;
import com.example.Meme.Website.models.ChatMessage;
import com.example.Meme.Website.models.ChatRoom;
import com.example.Meme.Website.models.ChatRoomSettings;
import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.models.MessageType;
import com.example.Meme.Website.services.ChatMessageService;
import com.example.Meme.Website.services.ChatRoomService;
import com.example.Meme.Website.services.ProfileService;
import com.example.Meme.Website.services.RateLimiterService;
import com.example.Meme.Website.services.memeService;
import com.fasterxml.jackson.core.type.TypeReference;
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
    private final ChatMessageService chatMessageService;
    private final ChatRoomService chatRoomService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public CustomWebSocketHandler(memeService memeService,
            ProfileService profileService,
            WebSocketSessionManager webSocketSessionManager,
            RateLimiterService rateLimiterService,
            RateLimitConfig rateLimitConfig,
            ChatMessageService chatMessageService,
            ChatRoomService chatRoomService) {
        this.memeService = memeService;
        this.profileService = profileService;
        this.webSocketSessionManager = webSocketSessionManager;
        this.rateLimiterService = rateLimiterService;
        this.rateLimitConfig = rateLimitConfig;
        this.chatMessageService = chatMessageService;
        this.chatRoomService = chatRoomService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Map<String, Object> attributes = session.getAttributes();
        String userId = (String) attributes.get("userId");

        if (userId != null) {
            WebSocketSessionManager.registerUserSession(userId, session);
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

            case "CHAT":
                handleChatMessage(json, session);
                break;

            // case "REACTION":
            // handleReaction(json, session);
            // break;

            case "EDIT_MESSAGE":
                handleEditMessage(json, session);
                break;

            case "DELETE_MESSAGE":
                handleDeleteMessage(json, session);
                break;

            // case "READ_RECEIPT":
            // handleReadReceipt(json, session);
            // break;

            case "MARK_AS_READ":
                handleMarkAsRead(json, session);
                break;

            case "TYPING_INDICATOR":
                handleTypingIndicator(json, session);
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

    // private void handleChatMessage(JsonNode json, WebSocketSession session)
    // throws IOException {
    // String senderId = (String) session.getAttributes().get("userId");
    // String senderName = (String) session.getAttributes().get("username");
    // if (senderId == null || senderName == null) {
    // session.sendMessage(new TextMessage("{\"error\": \"AUTH_REQUIRED\"}"));
    // return;
    // }

    // String chatRoomId = json.has("chatRoomId") ? json.get("chatRoomId").asText()
    // : null;
    // String messageText = json.has("message") ? json.get("message").asText() :
    // null;
    // String messageTypeStr = json.has("messageType") ?
    // json.get("messageType").asText() : "TEXT";
    // String mediaUrl = json.has("mediaUrl") ? json.get("mediaUrl").asText() :
    // null;
    // String repliedToMessageId = json.has("repliedToMessageId") ?
    // json.get("repliedToMessageId").asText() : null;

    // Set<String> participants;

    // // If chatRoomId missing, handle 1:1 creation
    // if (chatRoomId == null || chatRoomId.isEmpty()) {

    // if (!json.has("toUsername")) {
    // session.sendMessage(new
    // TextMessage("{\"error\":\"MISSING_TO_USERNAME_OR_CHATROOMID\"}"));
    // return;
    // }

    // String toUsername = json.get("toUsername").asText();

    // // Fetch userId from DB using toUsername
    // Map<String, String> receiverUserDetilas =
    // profileService.getUserDetailsByUsername(toUsername);
    // String receiverUserId = receiverUserDetilas.get("userId");
    // if (receiverUserId == null) {
    // session.sendMessage(new TextMessage("{\"error\":\"USER_NOT_FOUND\"}"));
    // return;
    // }

    // if (receiverUserId.equals(senderId)) {
    // session.sendMessage(new
    // TextMessage("{\"error\":\"CANNOT_CHAT_WITH_SELF\"}"));
    // return;
    // }

    // List<String> directParticipants = Arrays.asList(senderId, receiverUserId);
    // Collections.sort(directParticipants);

    // // Instead of findByParticipants only, ensure it's unique for 1:1 chats
    // Optional<ChatRoom> existingRoom = chatRoomService.findOneToOneRoom(senderId,
    // receiverUserId);

    // ChatRoom chatRoom;
    // if (existingRoom.isPresent()) {
    // chatRoom = existingRoom.get();
    // } else {
    // chatRoom = new ChatRoom();
    // chatRoom.setParticipants(new LinkedHashSet<>(directParticipants));
    // chatRoom.setGroupChat(false);
    // chatRoom.setCreatedAt(new Date());
    // chatRoom.setLastUpdated(new Date());
    // chatRoom = chatRoomService.saveChatRoom(chatRoom);

    // for (String userId : directParticipants) {
    // ChatRoomSettings settings = new ChatRoomSettings();
    // settings.setChatRoomId(chatRoom.getId());
    // settings.setUserId(userId);
    // settings.setMuted(false);
    // settings.setPinned(false);
    // settings.setTheme("default");
    // settings.setWallpaper(null);
    // settings.setLastSeenAt(null);
    // chatRoomService.saveChatRoomSettings(settings);
    // }
    // }

    // chatRoomId = chatRoom.getId();
    // participants = chatRoom.getParticipants();
    // } else {
    // Optional<ChatRoom> roomOpt = chatRoomService.getChatRoomById(chatRoomId);
    // if (roomOpt.isEmpty()) {
    // session.sendMessage(new TextMessage("{\"error\":\"INVALID_CHAT_ROOM\"}"));
    // return;
    // }
    // ChatRoom chatRoom = roomOpt.get();
    // participants = chatRoom.getParticipants();
    // if (!participants.contains(senderId)) {
    // session.sendMessage(new TextMessage("{\"error\": \"NOT_A_PARTICIPANT\"}"));
    // return;
    // }
    // }

    // // Build and save message
    // ChatMessage chatMessage = new ChatMessage();
    // chatMessage.setChatRoomId(chatRoomId);
    // chatMessage.setSenderId(senderId);
    // chatMessage.setMessageText(messageText);
    // chatMessage.setMessageType(MessageType.valueOf(messageTypeStr));
    // chatMessage.setMediaUrl(mediaUrl);
    // chatMessage.setTimestamp(new Date());
    // chatMessage.setDeleted(false);
    // chatMessage.setEditedAt(null);
    // chatMessage.setRepliedToMessageId(repliedToMessageId);

    // ChatMessage savedMessage = chatMessageService.saveMessage(chatMessage);

    // // Send message back to sender
    // ObjectNode senderResponse = objectMapper.valueToTree(savedMessage);
    // senderResponse.put("isOwn", true);
    // session.sendMessage(new
    // TextMessage(objectMapper.writeValueAsString(senderResponse)));

    // // Broadcast to all participants except sender with isOwn = false
    // for (String participantId : participants) {
    // if (!participantId.equals(senderId)) {
    // WebSocketSession participantSession =
    // WebSocketSessionManager.getSession(participantId);
    // if (participantSession != null && participantSession.isOpen()) {
    // ObjectNode receiverResponse = objectMapper.valueToTree(savedMessage);
    // receiverResponse.put("isOwn", false);
    // participantSession.sendMessage(new
    // TextMessage(objectMapper.writeValueAsString(receiverResponse)));
    // }
    // }
    // }

    // // Update chatRoom last message/time
    // chatRoomService.updateLastMessage(chatRoomId, savedMessage.getId(),
    // savedMessage.getTimestamp());

    // String updatePayload = "{\"type\":\"UPDATE_RECENT_CHAT\", \"chatRoomId\":\""
    // + chatRoomId + "\"}";
    // for (String participantId : participants) {
    // WebSocketSession participantSession =
    // WebSocketSessionManager.getSession(participantId);
    // if (participantSession != null && participantSession.isOpen()) {
    // participantSession.sendMessage(new TextMessage(updatePayload));
    // }
    // }
    // }

    private void handleChatMessage(JsonNode json, WebSocketSession session) throws IOException {
        String senderId = (String) session.getAttributes().get("userId");
        String senderName = (String) session.getAttributes().get("username");

        if (senderId == null || senderName == null) {
            session.sendMessage(new TextMessage("{\"error\": \"AUTH_REQUIRED\"}"));
            return;
        }

        String chatRoomId = json.has("chatRoomId") ? json.get("chatRoomId").asText() : null;
        String messageText = json.has("message") ? json.get("message").asText() : null;
        String messageTypeStr = json.has("messageType") ? json.get("messageType").asText() : "TEXT";
        String mediaUrl = json.has("mediaUrl") ? json.get("mediaUrl").asText() : null;
        String repliedToMessageId = json.has("repliedToMessageId") ? json.get("repliedToMessageId").asText() : null;
        String toUsername = json.has("toUsername") ? json.get("toUsername").asText() : null;

        Map<String, String> senderDetails = profileService.getUserDetailsByUsername(senderName);
        Map<String, String> receiverDetails = profileService.getUserDetailsByUsername(toUsername);
        Set<String> participants;

        // 1️⃣ Handle 1:1 Chat Room Creation
        if (chatRoomId == null || chatRoomId.isEmpty() || chatRoomId.startsWith("local-")) {
            if (!json.has("toUsername")) {
                session.sendMessage(new TextMessage("{\"error\":\"MISSING_TO_USERNAME_OR_CHATROOMID\"}"));
                return;
            }

            // Fetch sender & receiver details ONCE
            if (senderDetails == null) {
                session.sendMessage(new TextMessage("{\"error\":\"SENDER_NOT_FOUND\"}"));
                return;
            }
            if (receiverDetails == null) {
                session.sendMessage(new TextMessage("{\"error\":\"RECEIVER_NOT_FOUND\"}"));
                return;
            }

            if (receiverDetails == null || receiverDetails.get("userId") == null) {
                session.sendMessage(new TextMessage("{\"error\":\"USER_NOT_FOUND\"}"));
                return;
            }

            String receiverId = receiverDetails.get("userId");
            if (receiverId.equals(senderId)) {
                session.sendMessage(new TextMessage("{\"error\":\"CANNOT_CHAT_WITH_SELF\"}"));
                return;
            }

            List<String> directParticipants = Arrays.asList(senderId, receiverId);
            Collections.sort(directParticipants);

            Optional<ChatRoom> existingRoom = chatRoomService.findOneToOneRoom(senderId, receiverId);
            ChatRoom chatRoom;
            if (existingRoom.isPresent()) {
                chatRoom = existingRoom.get();
            } else {
                chatRoom = new ChatRoom();
                chatRoom.setParticipants(new LinkedHashSet<>(directParticipants));
                chatRoom.setGroupChat(false);
                chatRoom.setCreatedAt(new Date());
                chatRoom.setLastUpdated(new Date());
                chatRoom = chatRoomService.saveChatRoom(chatRoom);

                for (String userId : directParticipants) {
                    ChatRoomSettings settings = new ChatRoomSettings();
                    settings.setChatRoomId(chatRoom.getId());
                    settings.setUserId(userId);
                    settings.setMuted(false);
                    settings.setPinned(false);
                    settings.setTheme("default");
                    settings.setWallpaper(null);
                    settings.setLastSeenAt(null);
                    chatRoomService.saveChatRoomSettings(settings);
                }
            }

            chatRoomId = chatRoom.getId();
            participants = chatRoom.getParticipants();

        } else {
            Optional<ChatRoom> roomOpt = chatRoomService.getChatRoomById(chatRoomId);
            if (roomOpt.isEmpty()) {
                session.sendMessage(new TextMessage("{\"error\":\"INVALID_CHAT_ROOM\"}"));
                return;
            }
            ChatRoom chatRoom = roomOpt.get();
            participants = chatRoom.getParticipants();

            if (!participants.contains(senderId)) {
                session.sendMessage(new TextMessage("{\"error\": \"NOT_A_PARTICIPANT\"}"));
                return;
            }

        }

        // 2️⃣ Build & Save Message
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setChatRoomId(chatRoomId);
        chatMessage.setSenderId(senderId);
        chatMessage.setMessageText(messageText);
        chatMessage.setMessageType(MessageType.valueOf(messageTypeStr.toUpperCase()));
        chatMessage.setMediaUrl(mediaUrl);
        chatMessage.setTimestamp(new Date());
        chatMessage.setRead(false);
        chatMessage.setDeleted(false);
        chatMessage.setEditedAt(null);
        chatMessage.setRepliedToMessageId(repliedToMessageId);

        ChatMessage savedMessage = chatMessageService.saveMessage(chatMessage);

        // 3️⃣ Send to Sender
        ChatMessageResponse senderResponse = new ChatMessageResponse(
                savedMessage.getId(),
                savedMessage.getChatRoomId(),
                savedMessage.getMessageText(),
                savedMessage.getMessageType(),
                savedMessage.getMediaUrl(),
                savedMessage.getTimestamp().toInstant().toString(), // ISO string
                true, // isOwn
                senderId,
                senderDetails.get("username"),
                senderDetails.get("profilePictureUrl"));

        Map<String, Object> payload = objectMapper.convertValue(senderResponse,
                new TypeReference<Map<String, Object>>() {
                });
        payload.put("type", "CHAT"); // add extra field
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));

        // 4️⃣ Send to Receiver(s)
        for (String participantId : participants) {
            if (!participantId.equals(senderId)) {
                WebSocketSession participantSession = WebSocketSessionManager.getSession(participantId);
                if (participantSession != null && participantSession.isOpen()) {

                    ChatMessageResponse receiverResponse = new ChatMessageResponse(
                            savedMessage.getId(),
                            savedMessage.getChatRoomId(),
                            savedMessage.getMessageText(),
                            savedMessage.getMessageType(),
                            savedMessage.getMediaUrl(),
                            savedMessage.getTimestamp().toInstant().toString(),
                            false, // isOwn
                            senderId, // important: receiver must see who sent it
                            senderDetails.get("username"),
                            senderDetails.get("profilePictureUrl"));

                    Map<String, Object> receiverpayload = objectMapper.convertValue(
                            receiverResponse,
                            new TypeReference<Map<String, Object>>() {
                            });
                    payload.put("type", "CHAT");

                    participantSession.sendMessage(
                            new TextMessage(objectMapper.writeValueAsString(receiverpayload)));

                    // participantSession.sendMessage(
                    // new TextMessage(objectMapper.writeValueAsString(receiverResponse)));
                }
            }
        }

        // 5️⃣ Update Recent Chat
        for (String participantId : participants) {
            ObjectNode updatePayload = objectMapper.createObjectNode();
            updatePayload.put("type", "UPDATE_RECENT_CHAT");
            updatePayload.put("chatRoomId", chatRoomId);

            // if participant is sender → show receiver info, else → show sender info
            if (participantId.equals(senderId)) {
                updatePayload.put("displayName", receiverDetails.get("username"));
                updatePayload.put("displayPicture", receiverDetails.get("profilePictureUrl"));
            } else {
                updatePayload.put("displayName", senderDetails.get("username"));
                updatePayload.put("displayPicture", senderDetails.get("profilePictureUrl"));
            }

            updatePayload.put("message", messageText);

            WebSocketSession participantSession = WebSocketSessionManager.getSession(participantId);
            if (participantSession != null && participantSession.isOpen()) {
                participantSession.sendMessage(new TextMessage(updatePayload.toString()));
            }
        }

        chatRoomService.updateLastMessage(chatRoomId, savedMessage.getId(), savedMessage.getTimestamp());
    }

    // private void handleReaction(JsonNode json, WebSocketSession session) throws
    // IOException {
    // String userId = (String) session.getAttributes().get("userId");
    // if (userId == null) {
    // session.sendMessage(new TextMessage("{\"error\": \"AUTH_REQUIRED\"}"));
    // return;
    // }

    // String messageId = json.get("messageId").asText();
    // String emoji = json.get("emoji").asText();
    // boolean addReaction = json.has("add") && json.get("add").asBoolean(true); //
    // default true

    // Optional<ChatMessage> msgOpt = chatMessageService.getMessageById(messageId);
    // if (msgOpt.isEmpty()) {
    // session.sendMessage(new TextMessage("{\"error\": \"MESSAGE_NOT_FOUND\"}"));
    // return;
    // }

    // ChatMessage message = msgOpt.get();
    // Map<String, Set<String>> reactions = message.getReactions();
    // if (reactions == null) {
    // reactions = new HashMap<>();
    // }

    // Set<String> usersReacted = reactions.getOrDefault(emoji, new HashSet<>());

    // if (addReaction) {
    // usersReacted.add(userId);
    // } else {
    // usersReacted.remove(userId);
    // }

    // if (usersReacted.isEmpty()) {
    // reactions.remove(emoji);
    // } else {
    // reactions.put(emoji, usersReacted);
    // }

    // message.setReactions(reactions);
    // chatMessageService.saveMessage(message);

    // // Broadcast reaction update to all participants in chatRoom
    // ChatRoom chatRoom =
    // chatRoomService.getChatRoomById(message.getChatRoomId()).orElse(null);
    // if (chatRoom == null)
    // return;

    // String jsonResponse = objectMapper.writeValueAsString(Map.of(
    // "type", "REACTION_UPDATE",
    // "messageId", messageId,
    // "reactions", reactions));

    // for (String participantId : chatRoom.getParticipants()) {
    // WebSocketSession participantSession =
    // WebSocketSessionManager.getSession(participantId);
    // if (participantSession != null && participantSession.isOpen()) {
    // participantSession.sendMessage(new TextMessage(jsonResponse));
    // }
    // }
    // }

    private void handleEditMessage(JsonNode json, WebSocketSession session) throws IOException {
        String userId = (String) session.getAttributes().get("userId");
        if (userId == null) {
            session.sendMessage(new TextMessage("{\"error\": \"AUTH_REQUIRED\"}"));
            return;
        }

        String messageId = json.get("messageId").asText();
        String newText = json.has("message") ? json.get("message").asText() : null;
        String newMediaUrl = json.has("mediaUrl") ? json.get("mediaUrl").asText() : null;

        Optional<ChatMessage> msgOpt = chatMessageService.getMessageById(messageId);
        if (msgOpt.isEmpty()) {
            session.sendMessage(new TextMessage("{\"error\": \"MESSAGE_NOT_FOUND\"}"));
            return;
        }

        ChatMessage message = msgOpt.get();

        if (!message.getSenderId().equals(userId)) {
            session.sendMessage(new TextMessage("{\"error\": \"NOT_AUTHORIZED_TO_EDIT\"}"));
            return;
        }

        if (message.isDeleted()) {
            session.sendMessage(new TextMessage("{\"error\": \"MESSAGE_DELETED\"}"));
            return;
        }

        if (newText != null) {
            message.setMessageText(newText);
        }
        if (newMediaUrl != null) {
            message.setMediaUrl(newMediaUrl);
        }
        message.setEditedAt(new Date());

        chatMessageService.saveMessage(message);

        // Broadcast edited message
        ChatRoom chatRoom = chatRoomService.getChatRoomById(message.getChatRoomId()).orElse(null);
        if (chatRoom == null)
            return;

        String jsonResponse = objectMapper.writeValueAsString(Map.of(
                "type", "EDITED_MESSAGE",
                "message", message));

        for (String participantId : chatRoom.getParticipants()) {
            WebSocketSession participantSession = WebSocketSessionManager.getSession(participantId);
            if (participantSession != null && participantSession.isOpen()) {
                participantSession.sendMessage(new TextMessage(jsonResponse));
            }
        }
    }

    private void handleDeleteMessage(JsonNode json, WebSocketSession session) throws IOException {
        String userId = (String) session.getAttributes().get("userId");
        if (userId == null) {
            session.sendMessage(new TextMessage("{\"error\": \"AUTH_REQUIRED\"}"));
            return;
        }

        String messageId = json.get("messageId").asText();

        Optional<ChatMessage> msgOpt = chatMessageService.getMessageById(messageId);
        if (msgOpt.isEmpty()) {
            session.sendMessage(new TextMessage("{\"error\": \"MESSAGE_NOT_FOUND\"}"));
            return;
        }

        ChatMessage message = msgOpt.get();

        // Only sender or admins can delete
        ChatRoom chatRoom = chatRoomService.getChatRoomById(message.getChatRoomId()).orElse(null);
        if (chatRoom == null)
            return;

        boolean isAdmin = chatRoom.isGroupChat() && chatRoom.getAdmins() != null
                && chatRoom.getAdmins().contains(userId);
        if (!message.getSenderId().equals(userId) && !isAdmin) {
            session.sendMessage(new TextMessage("{\"error\": \"NOT_AUTHORIZED_TO_DELETE\"}"));
            return;
        }

        message.setDeleted(true);
        chatMessageService.saveMessage(message);

        // Broadcast deleted message info
        String jsonResponse = objectMapper.writeValueAsString(Map.of(
                "type", "DELETED_MESSAGE",
                "messageId", messageId));

        for (String participantId : chatRoom.getParticipants()) {
            WebSocketSession participantSession = WebSocketSessionManager.getSession(participantId);
            if (participantSession != null && participantSession.isOpen()) {
                participantSession.sendMessage(new TextMessage(jsonResponse));
            }
        }
    }

    // private void handleMarkAsRead(JsonNode json, WebSocketSession session) throws
    // IOException {
    // String userId = (String) session.getAttributes().get("userId");
    // if (userId == null) {
    // session.sendMessage(new TextMessage("{\"error\": \"AUTH_REQUIRED\"}"));
    // return;
    // }

    // String chatRoomId = json.get("chatRoomId").asText();

    // long updatedCount =
    // chatMessageService.markMessagesAsReadByUserInChatRoom(chatRoomId, userId);

    // if (updatedCount > 0) {
    // // Send success with count of updated messages
    // session.sendMessage(new TextMessage(
    // "{\"type\":\"MARK_AS_READ_SUCCESS\",\"chatRoomId\":\"" + chatRoomId +
    // "\",\"updatedCount\":"
    // + updatedCount + "}"));
    // } else {
    // // No messages were updated
    // session.sendMessage(new TextMessage(
    // "{\"type\":\"NO_MESSAGES_UPDATED\",\"chatRoomId\":\"" + chatRoomId + "\"}"));
    // }
    // }

    private void handleMarkAsRead(JsonNode json, WebSocketSession session) throws IOException {
        String userId = (String) session.getAttributes().get("userId");
        if (userId == null) {
            session.sendMessage(new TextMessage("{\"success\":false,\"error\":\"AUTH_REQUIRED\"}"));
            return;
        }

        String chatRoomId = json.get("chatRoomId").asText();

        try {
            long updatedCount = chatMessageService.markMessagesAsReadByUserInChatRoom(chatRoomId, userId);

            if (updatedCount > 0) {
                session.sendMessage(new TextMessage(
                        "{\"success\":true,\"chatRoomId\":\"" + chatRoomId + "\",\"updatedCount\":" + updatedCount
                                + "}"));
            } else {
                session.sendMessage(new TextMessage(
                        "{\"success\":false,\"chatRoomId\":\"" + chatRoomId + "\"}"));
            }
        } catch (Exception e) {
            // Log error for debugging
            e.printStackTrace();

            // Send DB error response
            session.sendMessage(new TextMessage(
                    "{\"success\":false,\"error\":\"DB_ERROR\"}"));
        }
    }

    // private void handleReadReceipt(JsonNode json, WebSocketSession session)
    // throws IOException {
    // String userId = (String) session.getAttributes().get("userId");
    // if (userId == null) {
    // session.sendMessage(new TextMessage("{\"error\": \"AUTH_REQUIRED\"}"));
    // return;
    // }

    // String chatRoomId = json.get("chatRoomId").asText();
    // long readTimestampMillis = json.has("readTimestamp") ?
    // json.get("readTimestamp").asLong()
    // : System.currentTimeMillis();
    // Date readTimestamp = new Date(readTimestampMillis);

    // // Mark messages as read by user up to readTimestamp
    // List<ChatMessage> unreadMessages =
    // chatMessageService.findUnreadMessagesByUserInChatRoom(chatRoomId, userId);

    // boolean updated = false;
    // for (ChatMessage message : unreadMessages) {
    // if (message.getTimestamp().compareTo(readTimestamp) <= 0) {
    // Set<String> seenBy = message.getSeenBy();
    // if (seenBy == null) {
    // seenBy = new HashSet<>();
    // }
    // if (!seenBy.contains(userId)) {
    // seenBy.add(userId);
    // message.setSeenBy(seenBy);
    // chatMessageService.saveMessage(message);
    // updated = true;
    // }
    // }
    // }

    // if (updated) {
    // // Optionally update user's lastSeenAt in ChatRoomSettings
    // Optional<ChatRoomSettings> settingsOpt =
    // chatRoomService.getChatRoomSettings(chatRoomId, userId);
    // settingsOpt.ifPresent(settings -> {
    // if (settings.getLastSeenAt() == null ||
    // settings.getLastSeenAt().before(readTimestamp)) {
    // settings.setLastSeenAt(readTimestamp);
    // chatRoomService.saveChatRoomSettings(settings);
    // }
    // });

    // // Notify other participants about read receipt update if needed
    // ChatRoom chatRoom = chatRoomService.getChatRoomById(chatRoomId).orElse(null);
    // if (chatRoom != null) {
    // String jsonResponse = objectMapper.writeValueAsString(Map.of(
    // "type", "READ_RECEIPT_UPDATE",
    // "chatRoomId", chatRoomId,
    // "userId", userId,
    // "readTimestamp", readTimestamp.getTime()));

    // for (String participantId : chatRoom.getParticipants()) {
    // if (!participantId.equals(userId)) {
    // WebSocketSession participantSession =
    // WebSocketSessionManager.getSession(participantId);
    // if (participantSession != null && participantSession.isOpen()) {
    // participantSession.sendMessage(new TextMessage(jsonResponse));
    // }
    // }
    // }
    // }
    // }
    // }

    private void handleTypingIndicator(JsonNode json, WebSocketSession session) throws IOException {
        String userId = (String) session.getAttributes().get("userId");
        if (userId == null) {
            session.sendMessage(new TextMessage("{\"error\": \"AUTH_REQUIRED\"}"));
            return;
        }

        String chatRoomId = json.get("chatRoomId").asText();
        boolean isTyping = json.has("isTyping") && json.get("isTyping").asBoolean();

        Optional<ChatRoom> chatRoomOpt = chatRoomService.getChatRoomById(chatRoomId);
        if (chatRoomOpt.isEmpty()) {
            session.sendMessage(new TextMessage("{\"error\": \"INVALID_CHAT_ROOM\"}"));
            return;
        }

        ChatRoom chatRoom = chatRoomOpt.get();
        Set<String> participants = chatRoom.getParticipants();

        if (!participants.contains(userId)) {
            session.sendMessage(new TextMessage("{\"error\": \"NOT_A_PARTICIPANT\"}"));
            return;
        }

        // Prepare typing indicator message
        String jsonResponse = objectMapper.writeValueAsString(Map.of(
                "type", "TYPING_INDICATOR",
                "chatRoomId", chatRoomId,
                "userId", userId,
                "isTyping", isTyping));

        // Broadcast typing indicator to all other participants
        for (String participantId : participants) {
            if (!participantId.equals(userId)) {
                WebSocketSession participantSession = WebSocketSessionManager.getSession(participantId);
                if (participantSession != null && participantSession.isOpen()) {
                    participantSession.sendMessage(new TextMessage(jsonResponse));
                }
            }
        }
    }

    private void handleCommentEvent(JsonNode json, WebSocketSession session, String username) throws IOException {
        Comments comment = new Comments();

        comment.setMemeId(json.get("memeId").asText());
        comment.setText(json.get("text").asText());

        String commentUserId = (String) session.getAttributes().get("userId");
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
