package com.example.Meme.Website.models;

import java.time.Instant;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "user-settings")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class userSettings {
    @Id
    private String id;
    
    @Indexed
    private String userId;

    private String theme;

    private Instant updatedAt;

    public void applyUpdatesFromMap(Map<String, String> updates) {
        if (updates.containsKey("theme")) {
            this.theme = updates.get("theme");
        }


        this.updatedAt = Instant.now();
    }
}
