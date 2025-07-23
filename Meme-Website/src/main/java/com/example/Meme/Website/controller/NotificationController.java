package com.example.Meme.Website.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Meme.Website.services.NotificationService;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;

    @GetMapping("/{username}")
    public ResponseEntity<?> getNotificationsByUserId(@PathVariable String username) {
        try {
            return notificationService.getNotificationsByUsername(username);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching notifications: " + e.getMessage());
        }
    }

    @PostMapping("/{username}/mark-multiple-read")
    public ResponseEntity<?> markNotificatonsAsRead(@PathVariable String username){
        return notificationService.markNotificationsAsRead(username);
    }
}
