package com.example.Meme.Website.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.example.Meme.Website.models.ChatRoom;

public interface chatRoomRepopsitory extends MongoRepository<ChatRoom, String> {
    // Optional<ChatRoom> findByParticipants(Set<String> participants);
    // List<ChatRoom> findByParticipantsContaining(String userId);

    Optional<ChatRoom> findByParticipants(Set<String> participants);

    // Find all chat rooms where user participates
    List<ChatRoom> findByParticipantsContaining(String userId);

    // Find all group chats where user participates
    @Query("{ 'participants': ?0, 'isGroupChat': true }")
    List<ChatRoom> findGroupChatsByUser(String userId);

    // Find all non-group chats (direct chats) for user
    @Query("{ 'participants': ?0, 'isGroupChat': false }")
    List<ChatRoom> findDirectChatsByUser(String userId);

    // Find chat rooms updated after given date (for sync)
    List<ChatRoom> findByParticipantsContainingAndLastUpdatedAfter(String userId, Date lastUpdated);

    @Query("{ 'participants': { $all: ?0, $size: 2 }, 'groupChat': false }")
    Optional<ChatRoom> findOneToOneRoom(Set<String> participants);
}
