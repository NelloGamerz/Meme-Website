package com.example.Meme.Website.dto;

import com.example.Meme.Website.models.MessageType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private String messageId;
    private String chatRoomId;
    private String messageText;
    private MessageType messageType;
    private String mediaUrl;
    private String timestamp;
    private boolean isOwn;

    private String senderId;
    private String senderUsername;
    private String senderProfilePictureUrl;
}
