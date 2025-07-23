package com.example.Meme.Website.services;

import java.io.IOException;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;


import com.example.Meme.Website.WebSockets.WebSocketSessionManager;
import com.example.Meme.Website.models.NotificationModel;
import com.example.Meme.Website.repository.notificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class NotificationService {

    @Autowired
    private notificationRepository notificationRepository;
    
    @Autowired
    private ObjectMapper objectMapper;

    public void sendNotification(String sender, String recepient, String type, String message, String profilePictureUrl, String memeId) {
        NotificationModel notification = new NotificationModel();
        notification.setSenderUsername(sender);
        notification.setReceiverUsername(recepient);
        notification.setProfilePictureUrl(profilePictureUrl);
        notification.setMemeId(memeId);
        notification.setType(type);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(new Date());

        notificationRepository.save(notification);

        try{
            String jsonNotification = objectMapper.writeValueAsString(notification);
            WebSocketSessionManager.sendToUser(recepient, jsonNotification);
        }
        catch(IOException e){
            e.printStackTrace();
        }
        
    }

    public ResponseEntity<?> getNotificationsByUsername(String username) {
        try {
            return ResponseEntity.ok(notificationRepository.findByReceiverUsername(username));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching notifications: " + e.getMessage());
        }
    }

    public ResponseEntity<?> markNotificationsAsRead(String username) {
        try {
            var notifications = notificationRepository.findByReceiverUsernameAndIsReadFalse(username);
            for (NotificationModel notification : notifications) {
                notification.setRead(true);
                notification.setReadAt(new Date());
                notificationRepository.save(notification);
            }
            return ResponseEntity.ok("Notifications marked as read");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error marking notifications as read: " + e.getMessage());
        }
    }
    
}
