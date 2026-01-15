package com.example.Meme.Website.services;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.dto.ChatMessageResponse;
// import com.example.Meme.Website.dto.RecentChat;
import com.example.Meme.Website.dto.RecentChatDto;
import com.example.Meme.Website.models.ChatMessage;
import com.example.Meme.Website.models.ChatRoom;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;

@Service
public class ChatService {

    @Autowired
    private ChatRoomService chatRoomService;
    @Autowired
    private ChatMessageService chatMessageService;
    @Autowired
    private userRepository userRepository;
    @Autowired
    private ProfileService profileService;

    // public List<RecentChatDto> getRecentChats(String userId) {
    // List<ChatRoom> chatRooms = chatRoomService.getUserChatRooms(userId);

    // List<RecentChatDto> recentChats = chatRooms.stream().map(room -> {
    // ChatMessage lastMessage = null;
    // if (room.getLastMessageId() != null) {
    // lastMessage =
    // chatMessageService.getMessageById(room.getLastMessageId()).orElse(null);
    // }

    // int unreadCount =
    // chatMessageService.findUnreadMessagesByUserInChatRoom(room.getId(),
    // userId).size();

    // Set<String> otherParticipants = room.getParticipants().stream()
    // .filter(p -> !p.equals(userId))
    // .collect(Collectors.toSet());

    // return new RecentChatDto(
    // room.getId(),
    // room.isGroupChat(),
    // room.getGroupName(),
    // room.getGroupAvatarUrl(),
    // lastMessage != null ? lastMessage.getMessageText() : null,
    // lastMessage != null ? lastMessage.getTimestamp() : room.getLastUpdated(),
    // unreadCount,
    // otherParticipants
    // );
    // }).sorted(Comparator.comparing(RecentChatDto::getLastUpdated).reversed())
    // .collect(Collectors.toList());

    // return recentChats;
    // }

    public List<RecentChatDto> getRecentChats(String userId) {
        List<ChatRoom> chatRooms = chatRoomService.getUserChatRooms(userId);

        List<RecentChatDto> recentChats = chatRooms.stream().map(room -> {
            ChatMessage lastMessage = null;
            if (room.getLastMessageId() != null) {
                lastMessage = chatMessageService.getMessageById(room.getLastMessageId()).orElse(null);
            }

            Long unreadCount = chatMessageService.countUnreadMessagesByChatRoomIdAndNotSender(room.getId(), userId);

            Set<String> otherParticipants = room.getParticipants().stream()
                    .filter(p -> !p.equals(userId))
                    .collect(Collectors.toSet());

            String displayName = null;
            String displayAvatar = null;

            if (room.isGroupChat()) {
                displayName = room.getGroupName();
                displayAvatar = room.getGroupAvatarUrl();
            } else if (!otherParticipants.isEmpty()) {
                // 1:1 chat → fetch other user's profile
                String otherUserId = otherParticipants.iterator().next();
                Optional<userModel> otherUserOpt = userRepository.findById(otherUserId);
                if (otherUserOpt.isPresent()) {
                    userModel otherUser = otherUserOpt.get();
                    displayName = otherUser.getUsername();
                    displayAvatar = otherUser.getProfilePictureUrl(); // Assuming your UserModel has avatar
                }
            }

            return new RecentChatDto(
                    room.getId(),
                    room.isGroupChat(),
                    displayName,
                    displayAvatar,
                    lastMessage != null ? lastMessage.getMessageText() : null,
                    lastMessage != null ? lastMessage.getTimestamp() : room.getLastUpdated(),
                    unreadCount);
        }).sorted(Comparator.comparing(RecentChatDto::getLastUpdated).reversed())
                .collect(Collectors.toList());

        return recentChats;
    }

    // Get messages for a specific chat room
    // public List<ChatMessageResponse> getMessagesByChatRoom(String chatRoomId,
    // String userId) {
    // return chatMessageService.getMessagesByChatRoom(chatRoomId, userId);
    // }

    public List<ChatMessageResponse> getMessagesByChatRoom(String chatRoomId, String userId, int page, int size) {
        return chatMessageService.getMessagesByChatRoom(chatRoomId, userId, page, size);
    }

    // public String getRoomChatId(String userId, String username){
    // String targetUserId = profileService.getUserIdByUsername(username);
    // if (targetUserId == null) {
    // throw new RuntimeException("User not found: " + username);
    // }

    // ChatRoom chatRoomOpt = chatRoomService.getChatRoomBetweenUsers(userId,
    // targetUserId);
    // if (chatRoomOpt != null) {
    // return chatRoomOpt.getId();
    // } else {
    // throw new RuntimeException("No chat room found between users");
    // }
    // }

    public String getRoomChatId(String userId, String username) {
        Map<String, String> targetUser = profileService.getUserDetailsByUsername(username);
        String targetUserId = targetUser.get("userId");
        if (targetUserId == null) {
            throw new NoSuchElementException("User not found: " + username);
        }

        ChatRoom chatRoom = chatRoomService.getChatRoomBetweenUsers(userId, targetUserId);
        if (chatRoom != null) {
            return chatRoom.getId();
        } else {
            throw new NoSuchElementException("No chat room present between users");
        }
    }

}
