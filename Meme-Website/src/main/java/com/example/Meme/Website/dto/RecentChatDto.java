package com.example.Meme.Website.dto;

import java.util.Date;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentChatDto {
    private String chatRoomId;
    private boolean isGroup;
    private String username;
    private String profilePictureUrl;
    private String lastMessage;
    private Date lastUpdated;
    private Long unreadCount;
}
