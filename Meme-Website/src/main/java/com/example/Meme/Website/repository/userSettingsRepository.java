package com.example.Meme.Website.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.Meme.Website.models.userSettings;

public interface userSettingsRepository extends MongoRepository<userSettings, String> {
    Optional<userSettings> findByUserId(String userId);
}
