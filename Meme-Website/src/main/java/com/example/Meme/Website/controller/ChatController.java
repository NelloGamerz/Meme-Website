package com.example.Meme.Website.controller;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Meme.Website.dto.ChatMessageResponse;
import com.example.Meme.Website.dto.RecentChatDto;
import com.example.Meme.Website.models.ChatMessage;
import com.example.Meme.Website.models.UserPrincipal;
import com.example.Meme.Website.services.ChatService;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    // @GetMapping("/rooms")
    // public ResponseEntity<?> getRoomChatId(@AuthenticationPrincipal UserPrincipal
    // user,
    // @RequestBody String username) {
    // return ResponseEntity.ok(chatService.getRoomChatId(user.getUserId(),
    // username));
    // }

    @GetMapping("/rooms")
    public ResponseEntity<?> getRoomChatId(@AuthenticationPrincipal UserPrincipal user,
            @RequestParam String username) {
        try {
            String chatRoomId = chatService.getRoomChatId(user.getUserId(), username);
            return ResponseEntity.ok(chatRoomId);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<List<RecentChatDto>> getRecentChats(@AuthenticationPrincipal UserPrincipal user) {
        List<RecentChatDto> recentChats = chatService.getRecentChats(user.getUserId());
        return ResponseEntity.ok(recentChats);
    }

    // 2️⃣ Get messages in a specific chat room
    // @GetMapping("/messages/{chatRoomId}")
    // public ResponseEntity<List<ChatMessageResponse>> getMessages(
    // @AuthenticationPrincipal UserPrincipal user,
    // @PathVariable String chatRoomId) {
    // List<ChatMessageResponse> messages =
    // chatService.getMessagesByChatRoom(chatRoomId, user.getUserId());
    // return ResponseEntity.ok(messages);
    // }

    @GetMapping("/messages/{chatRoomId}")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable String chatRoomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        List<ChatMessageResponse> messages = chatService.getMessagesByChatRoom(chatRoomId, user.getUserId(), page,
                size);
        return ResponseEntity.ok(messages);
    }
}
