package com.example.Meme.Website.services;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.dto.ChatMessageResponse;
import com.example.Meme.Website.models.ChatMessage;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.chatMessageRepository;
import com.example.Meme.Website.repository.userRepository;
import com.mongodb.client.result.UpdateResult;

@Service
public class ChatMessageService {

    @Autowired
    private chatMessageRepository chatMessageRepository;

    @Autowired
    private userRepository userRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public ChatMessage saveMessage(ChatMessage chatModel) {
        if (chatModel.getTimestamp() == null) {
            chatModel.setTimestamp(new Date());
        }
        return chatMessageRepository.save(chatModel);
    }

    // public List<ChatMessageResponse> getMessagesByChatRoom(String chatRoomId,
    // String currentUserId) {
    // // return
    // chatMessageRepository.findByChatRoomIdOrderByTimestampAsc(chatRoomId);
    // List<ChatMessage> messages =
    // chatMessageRepository.findByChatRoomIdOrderByTimestampAsc(chatRoomId);

    // return messages.stream().map(msg -> {
    // userModel sender = userRepository.findById(msg.getSenderId())
    // .orElseThrow(() -> new RuntimeException("User not found"));

    // ChatMessageResponse dto = new ChatMessageResponse();
    // dto.setMessageId(msg.getId());
    // dto.setMessageText(msg.getMessageText());
    // dto.setMessageType(msg.getMessageType());
    // dto.setMediaUrl(msg.getMediaUrl());
    // dto.setTimestamp(msg.getTimestamp().toString());

    // dto.setSenderId(sender.getUserId());
    // dto.setSenderUsername(sender.getUsername());
    // dto.setSenderProfilePictureUrl(sender.getProfilePictureUrl());

    // dto.setOwn(msg.getSenderId().equals(currentUserId));

    // return dto;
    // }).collect(Collectors.toList());
    // }

    public List<ChatMessageResponse> getMessagesByChatRoom(String chatRoomId, String currentUserId, int page,
            int size) {
        // Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").ascending());
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<ChatMessage> messagesPage = chatMessageRepository.findByChatRoomIdOrderByTimestampDesc(chatRoomId,
                pageable);

        System.out.println(messagesPage.getTotalElements());

        return messagesPage.getContent().stream().map(msg -> {
            userModel sender = userRepository.findById(msg.getSenderId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ChatMessageResponse dto = new ChatMessageResponse();
            dto.setMessageId(msg.getId());
            dto.setMessageText(msg.getMessageText());
            dto.setMessageType(msg.getMessageType());
            dto.setMediaUrl(msg.getMediaUrl());
            dto.setTimestamp(msg.getTimestamp().toString());

            dto.setSenderId(sender.getUserId());
            dto.setSenderUsername(sender.getUsername());
            dto.setSenderProfilePictureUrl(sender.getProfilePictureUrl());

            dto.setOwn(msg.getSenderId().equals(currentUserId));

            return dto;
        }).collect(Collectors.toList());
    }

    // public List<ChatMessage> getUnreadMessagesByUser(String userId, String chatRoomId) {
    //     // Returns messages in chatRoom not yet seen by user
    //     return chatMessageRepository.countUnreadMessagesByChatRoomIdAndNotSender(chatRoomId, userId);
    // }

    public Optional<ChatMessage> getMessageById(String messageId) {
        return chatMessageRepository.findById(messageId);
    }

    // public void markMessageSeenByUser(String messageId, String userId) {
    // chatMessageRepository.findById(messageId).ifPresent(msg -> {
    // Set<String> seenBy = msg.getSeenBy();
    // if (seenBy == null)
    // seenBy = new HashSet<>();
    // if (!seenBy.contains(userId)) {
    // seenBy.add(userId);
    // msg.setSeenBy(seenBy);
    // chatMessageRepository.save(msg);
    // }
    // });
    // }

    public void deleteMessage(String messageId) {
        chatMessageRepository.findById(messageId).ifPresent(msg -> {
            msg.setDeleted(true);
            chatMessageRepository.save(msg);
        });
    }

    public void editMessage(String messageId, String newText, String newMediaUrl) {
        chatMessageRepository.findById(messageId).ifPresent(msg -> {
            if (newText != null)
                msg.setMessageText(newText);
            if (newMediaUrl != null)
                msg.setMediaUrl(newMediaUrl);
            msg.setEditedAt(new Date());
            chatMessageRepository.save(msg);
        });
    }

    // public void addReaction(String messageId, String userId, String emoji) {
    // chatMessageRepository.findById(messageId).ifPresent(msg -> {
    // Map<String, Set<String>> reactions = msg.getReactions();
    // if (reactions == null)
    // reactions = new HashMap<>();
    // Set<String> users = reactions.getOrDefault(emoji, new HashSet<>());
    // users.add(userId);
    // reactions.put(emoji, users);
    // msg.setReactions(reactions);
    // chatMessageRepository.save(msg);
    // });
    // }

    // public void removeReaction(String messageId, String userId, String emoji) {
    // chatMessageRepository.findById(messageId).ifPresent(msg -> {
    // Map<String, Set<String>> reactions = msg.getReactions();
    // if (reactions != null && reactions.containsKey(emoji)) {
    // Set<String> users = reactions.get(emoji);
    // users.remove(userId);
    // if (users.isEmpty())
    // reactions.remove(emoji);
    // else
    // reactions.put(emoji, users);
    // msg.setReactions(reactions);
    // chatMessageRepository.save(msg);
    // }
    // });
    // }

    public Long countUnreadMessagesByChatRoomIdAndNotSender(String chatRoomId, String userId) {
        return chatMessageRepository.countUnreadMessagesByChatRoomIdAndNotSender(chatRoomId, userId);
    }

    public long markMessagesAsReadByUserInChatRoom(String chatRoomId, String userId) {
        Query query = new Query(
            Criteria.where("chatRoomId").is(chatRoomId)
                    .and("senderId").ne(userId)
                    .and("isRead").is(false)
        );

        Update update = new Update().set("isRead", true);

        UpdateResult result = mongoTemplate.updateMulti(query, update, ChatMessage.class);

        return result.getModifiedCount(); // number of updated documents
    }
}
