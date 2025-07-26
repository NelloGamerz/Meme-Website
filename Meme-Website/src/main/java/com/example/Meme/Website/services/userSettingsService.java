package com.example.Meme.Website.services;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.models.userSettings;
import com.example.Meme.Website.repository.userSettingsRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class userSettingsService {

    @Autowired
    private RedisService redisService;

    @Autowired
    private userSettingsRepository userSettingsRepository;

    private static final String USER_SETTINGS_KEY = "user:settings:";

    public void updateUserSettings(String userId, Map<String, String> updates) {
        if (updates == null || updates.isEmpty()) {
            log.warn("⚠️ No settings provided for user '{}'", userId);
            return;
        }

        String theme = updates.get("theme");

        userSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> userSettings.builder()
                        .id(null)
                        .userId(userId)
                        .build());

        if (theme != null) {
            settings.setTheme(theme);
        }

        settings.setUpdatedAt(Instant.now());

        userSettingsRepository.save(settings);

        redisService.set("user:settings:" + userId, settings, 10, TimeUnit.MINUTES);

        log.info("✅ Settings updated for user '{}'", userId);
    }

    // public String getSetting(String userId, String field) {
    //     String redisKey = key(userId);
    //     String value = redisService.getHashFieldValue(redisKey, field);

    //     if (value != null)
    //         return value;

    //     Optional<userSettings> opt = userSettingsRepository.findByUserId(userId);
    //     if (opt.isEmpty())
    //         return null;

    //     userSettings settings = opt.get();

    //     return switch (field) {
    //         case "theme" -> settings.getTheme();
    //         default -> null;
    //     };
    // }

    public Map<String, String> getUserSettings(String userId) {
    String redisKey = key(userId);
    Map<String, String> settings = redisService.getAllHash(redisKey);

    // If Redis has values, return directly
    if (settings != null && !settings.isEmpty()) {
        return settings;
    }

    // Otherwise, fetch from DB
    Optional<userSettings> opt = userSettingsRepository.findByUserId(userId);
    if (opt.isEmpty()) {
        return Collections.emptyMap();
    }

    userSettings dbSettings = opt.get();
    Map<String, String> result = new HashMap<>();

    if (dbSettings.getTheme() != null) {
        result.put("theme", dbSettings.getTheme());
    }

    // Add more fields here as you expand your settings model
    // if (dbSettings.getLanguage() != null) {
    //     result.put("language", dbSettings.getLanguage());
    // }

    return result;
}


    private String key(String userId) {
        return USER_SETTINGS_KEY + ":" + userId;
    }
}
