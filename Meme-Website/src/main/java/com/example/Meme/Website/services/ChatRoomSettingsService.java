package com.example.Meme.Website.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.models.ChatRoomSettings;
import com.example.Meme.Website.repository.chatRoomSettingsRepository;

@Service
public class ChatRoomSettingsService {
    
    @Autowired
    private chatRoomSettingsRepository chatRoomSettingsRepository;

    public Optional<ChatRoomSettings> getSettings(String chatRoomId, String userId) {
        return chatRoomSettingsRepository.findByChatRoomIdAndUserId(chatRoomId, userId);
    }

    public ChatRoomSettings saveSettings(ChatRoomSettings settings) {
        return chatRoomSettingsRepository.save(settings);
    }

    public void updateMutedStatus(String chatRoomId, String userId, boolean isMuted) {
        getSettings(chatRoomId, userId).ifPresent(settings -> {
            settings.setMuted(isMuted);
            chatRoomSettingsRepository.save(settings);
        });
    }

    public void updatePinnedStatus(String chatRoomId, String userId, boolean isPinned) {
        getSettings(chatRoomId, userId).ifPresent(settings -> {
            settings.setPinned(isPinned);
            chatRoomSettingsRepository.save(settings);
        });
    }

    public void updateWallpaper(String chatRoomId, String userId, String wallpaperUrl) {
        getSettings(chatRoomId, userId).ifPresent(settings -> {
            settings.setWallpaper(wallpaperUrl);
            chatRoomSettingsRepository.save(settings);
        });
    }
}
