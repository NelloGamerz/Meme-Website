package com.example.Meme.Website.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Meme.Website.models.UserPrincipal;
import com.example.Meme.Website.services.NotificationService;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping()
    public ResponseEntity<?> getNotificationsByUserId(
            @AuthenticationPrincipal UserPrincipal user) {
        String username = user.getUsername();
        try {
            return notificationService.getNotificationsByUsername(username);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching notifications: " + e.getMessage());
        }
    }

    @PostMapping("/readAll")
    public ResponseEntity<?> markNotificatonsAsRead(
            @AuthenticationPrincipal UserPrincipal user) {
        String username = user.getUsername();
        return notificationService.markNotificationsAsRead(username);
    }
}
