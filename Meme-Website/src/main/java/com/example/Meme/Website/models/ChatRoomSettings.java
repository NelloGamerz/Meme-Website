package com.example.Meme.Website.models;

import java.util.Date;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "chatRoomSettings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomSettings {
    @Id
    private String id;

    @Indexed
    private String chatRoomId;

    @Indexed
    private String userId;

    private String wallpaper;         // URL or theme name

    private boolean isMuted;

    private boolean isPinned;

    private Date pinnedAt;            // for sorting pinned chats

    private Date lastSeenAt;          // last read timestamp for this chat by user

    private String theme;             // e.g., "dark", "light", "custom"

    // Notification settings (e.g., sound on/off)
    private boolean notificationsEnabled;

    private String customNotificationSound;

    // Optional user-specific metadata
    private Map<String, Object> metadata;
}
