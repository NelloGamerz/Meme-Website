package com.example.Meme.Website.services;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.models.ChatRoom;
import com.example.Meme.Website.models.ChatRoomSettings;
import com.example.Meme.Website.repository.chatRoomRepopsitory;
import com.example.Meme.Website.repository.chatRoomSettingsRepository;

// @Service
// public class ChatRoomService {
//     @Autowired
//     private chatRoomRepopsitory chatRoomRepository;

//     public Optional<ChatRoom> findChatRoomByParticipants(Set<String> participants) {
//         return chatRoomRepository.findByParticipants(participants);
//     }

//     public ChatRoom createOrGetChatRoom(Set<String> participants) {
//         return findChatRoomByParticipants(participants)
//                 .orElseGet(() -> {
//                     ChatRoom chatRoom = new ChatRoom();
//                     chatRoom.setParticipants(participants);
//                     chatRoom.setLastUpdated(new Date());
//                     chatRoom.setGroupChat(participants.size() > 2);
//                     return chatRoomRepository.save(chatRoom);
//                 });
//     }

//     public Optional<ChatRoom> getChatRoomById(String id) {
//         return chatRoomRepository.findById(id);
//     }

//     public List<ChatRoom> getUserChatRooms(String userId) {
//         return chatRoomRepository.findByParticipantsContaining(userId);
//     }

//     public void updateLastMessage(String chatRoomId, String messageId) {
//         Optional<ChatRoom> room = chatRoomRepository.findById(chatRoomId);
//         room.ifPresent(r -> {
//             r.setLastMessageId(messageId);
//             r.setLastUpdated(new Date());
//             chatRoomRepository.save(r);
//         });
//     }
// }

@Service
public class ChatRoomService {

    @Autowired
    private chatRoomRepopsitory chatRoomRepository;

    @Autowired
    private chatRoomSettingsRepository chatRoomSettingsRepository;

    public Optional<ChatRoom> findOneToOneRoom(String senderId, String toUserId) {
        return chatRoomRepository.findOneToOneRoom(Set.of(senderId, toUserId));
    }

    public Optional<ChatRoom> findByParticipants(Set<String> participants) {
        return chatRoomRepository.findByParticipants(participants);
    }

    public ChatRoom createOrGetChatRoom(Set<String> participants) {
        return findByParticipants(participants)
                .orElseGet(() -> {
                    ChatRoom chatRoom = new ChatRoom();
                    chatRoom.setParticipants(participants);
                    chatRoom.setLastUpdated(new Date());
                    chatRoom.setGroupChat(participants.size() > 2);
                    // chatRoom = chatRoomRepository.save(chatRoom);

                    ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);
                    // Initialize default ChatRoomSettings for all participants
                    participants.forEach(userId -> {
                        ChatRoomSettings settings = new ChatRoomSettings();
                        settings.setChatRoomId(savedChatRoom.getId());
                        settings.setUserId(userId);
                        settings.setMuted(false);
                        settings.setPinned(false);
                        settings.setTheme("default");
                        settings.setWallpaper(null);
                        settings.setLastSeenAt(null);
                        chatRoomSettingsRepository.save(settings);
                    });

                    return chatRoom;
                });
    }

    public Optional<ChatRoom> getChatRoomById(String id) {
        return chatRoomRepository.findById(id);
    }

    public List<ChatRoom> getUserChatRooms(String userId) {
        return chatRoomRepository.findByParticipantsContaining(userId);
    }

    public void updateLastMessage(String chatRoomId, String messageId, Date timestamp) {
        chatRoomRepository.findById(chatRoomId).ifPresent(room -> {
            room.setLastMessageId(messageId);
            room.setLastUpdated(timestamp != null ? timestamp : new Date());
            chatRoomRepository.save(room);
        });
    }

    public Optional<ChatRoomSettings> getChatRoomSettings(String chatRoomId, String userId) {
        return chatRoomSettingsRepository.findByChatRoomIdAndUserId(chatRoomId, userId);
    }

    public ChatRoomSettings saveChatRoomSettings(ChatRoomSettings settings) {
        return chatRoomSettingsRepository.save(settings);
    }

    public ChatRoom saveChatRoom(ChatRoom chatRoom) {
        return chatRoomRepository.save(chatRoom);
    }

    public ChatRoom getChatRoomBetweenUsers(String senderId, String receiverId) {
        return chatRoomRepository.findOneToOneRoom(Set.of(senderId, receiverId)).orElse(null);
    }
}
