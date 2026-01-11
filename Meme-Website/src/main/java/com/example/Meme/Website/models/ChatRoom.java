package com.example.Meme.Website.models;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "chatroom")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoom {

    @Id
    private String id;
    @Indexed
    private Set<String> participants;
    private boolean groupChat;
    private String groupName;
    private String groupAvatarUrl;
    private String createdBy;
    @Indexed
    private Date createdAt;
    @Indexed
    private Date lastUpdated;
    private String lastMessageId;
    private List<String> admins;
    private Map<String, Object> metadata;
}
