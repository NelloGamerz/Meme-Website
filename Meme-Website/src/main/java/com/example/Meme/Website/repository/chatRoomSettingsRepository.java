package com.example.Meme.Website.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.Meme.Website.models.ChatRoomSettings;

public interface chatRoomSettingsRepository extends MongoRepository<ChatRoomSettings, String> {
    // Optional<ChatRoomSettings> findByChatRoomIdAndUserId(String chatRoomId,
    // String userId);
    // List<ChatRoomSettings> findByUserId(String userId);

    // Find settings for a specific user in a specific chat room
    Optional<ChatRoomSettings> findByChatRoomIdAndUserId(String chatRoomId, String userId);

    // Find all chat room settings for a given user (e.g., to get pinned/muted
    // chats)
    List<ChatRoomSettings> findByUserId(String userId);

    // Find all pinned chat rooms for a user, ordered by pinnedAt desc
    List<ChatRoomSettings> findByUserIdAndIsPinnedTrueOrderByPinnedAtDesc(String userId);

    // Find all muted chat rooms for a user
    List<ChatRoomSettings> findByUserIdAndIsMutedTrue(String userId);

    // Find chat settings updated after a certain date (for sync)
    List<ChatRoomSettings> findByUserIdAndLastSeenAtAfter(String userId, Date lastSeenAt);

}
