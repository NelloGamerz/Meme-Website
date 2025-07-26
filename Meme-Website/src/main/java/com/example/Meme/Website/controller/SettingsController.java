package com.example.Meme.Website.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Meme.Website.models.UserPrincipal;
import com.example.Meme.Website.services.userSettingsService;

import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequestMapping("/user/settings")
public class SettingsController {
    @Autowired
    private userSettingsService settingsService;

    @PatchMapping
    public ResponseEntity<?> updateSettings(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody Map<String, String> updates) {
        String userId = user.getUserId();

        if (updates == null || updates.isEmpty()) {
            log.warn("⚠️ No settings provided for user '{}'", userId);
            return ResponseEntity.badRequest().body(Map.of("error", "No settings provided"));
        }

        settingsService.updateUserSettings(userId, updates);

        return ResponseEntity.ok(Map.of(
                "message", "Settings updated",
                "updated", updates != null ? updates : Map.of()
        ));
    }

    @GetMapping
    public ResponseEntity<?> getSettings(@AuthenticationPrincipal UserPrincipal user) {
        String userId = user.getUserId();
        Map<String, String> settings = settingsService.getUserSettings(userId);

        if (settings == null || settings.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No settings found for the user"));
        }

        return ResponseEntity.ok(settings);
    }

}
