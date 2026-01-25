package com.example.Meme.Website.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.example.Meme.Website.models.ChatMessage;

public interface chatMessageRepository extends MongoRepository<ChatMessage, String> {

    // List<ChatModel> findByChatRoomIdOrderByTimestampAsc(String chatRoomId);
    // List<ChatModel> findBySenderIdOrReceiverIdOrderByTimestampAsc(String
    // senderId,String receiverId);
    // List<ChatModel> findByChatRoomIdAndTimestampAfter(String chatRoomId, Date
    // timestamp);
    // List<ChatModel> findByReceiverIdAndChatRoomIdAndSeenFalse(String
    // receiverId,String chatRoomId);
    // long countByChatRoomIdAndSeenFalseAndReceiverId(String chatRoomId, String
    // receiverId);

    // Find all messages in a chat room ordered by timestamp ascending
    // List<ChatMessage> findByChatRoomIdOrderByTimestampAsc(String chatRoomId);

    Page<ChatMessage> findByChatRoomIdOrderByTimestampAsc(String chatRoomId, Pageable pageable);

    // Find messages in a chat room after a certain timestamp (for syncing)
    List<ChatMessage> findByChatRoomIdAndTimestampAfterOrderByTimestampAsc(String chatRoomId, Date timestamp);

    // Find messages NOT seen by a given user in a chat room (unread messages)
    // @Query("{ 'chatRoomId': ?0, 'seenBy': { $ne: ?1 } }")
    // List<ChatMessage> findUnreadMessagesByUserInChatRoom(String chatRoomId,
    // String userId);

    @Query(value = "{ 'chatRoomId': ?0, 'senderId': { $ne: ?1 }, 'isRead': false }", count = true)
    long countUnreadMessagesByChatRoomIdAndNotSender(String chatRoomId, String userId);

    // Count unread messages by user in a chat room
    @Query(value = "{ 'chatRoomId': ?0, 'seenBy': { $ne: ?1 }, 'deleted': false }", count = true)
    long countUnreadMessagesByUserInChatRoom(String chatRoomId, String userId);

    // Optional: Find messages reacted by a user with a specific emoji
    @Query("{ 'chatRoomId': ?0, 'reactions.?1': ?2 }")
    List<ChatMessage> findByChatRoomIdAndReaction(String chatRoomId, String emoji, String userId);

    // Find messages that are replies to a particular message (threaded replies)
    List<ChatMessage> findByRepliedToMessageIdOrderByTimestampAsc(String messageId);

    // Find recent messages with pagination (e.g. limit 50)
    Page<ChatMessage> findByChatRoomIdOrderByTimestampDesc(String chatRoomId, Pageable pageable);
}
