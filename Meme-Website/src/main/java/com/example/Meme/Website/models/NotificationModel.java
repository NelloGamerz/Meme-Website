package com.example.Meme.Website.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationModel {
    @Id
    private String id;

    private String senderUsername;
    private String receiverUsername;
    private String profilePictureUrl;
    private String type;
    private String message;
    private boolean isRead;
    private String memeId;

    private Date createdAt = new Date();

    private Date readAt;
}
