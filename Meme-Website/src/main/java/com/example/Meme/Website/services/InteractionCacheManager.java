package com.example.Meme.Website.services;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.DBO.Interaction;
import com.example.Meme.Website.models.UserInteractionCache;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class InteractionCacheManager {

    @Autowired
    private RedisService redisService;
    @Autowired
    private userRepository userRepository;;

    private final String PREFIX = "interaction:";
    private static final long TTL_SECONDS = 300;

    public void cacheInteraction(String userId, Interaction interaction) {
        String key = PREFIX + userId;
        UserInteractionCache cache = redisService.get(key, UserInteractionCache.class);
        if (cache == null) {
            cache = new UserInteractionCache();
        }

        boolean exists = cache.getInteractions().stream()
                .anyMatch(i -> i.getPostID().equals(interaction.getPostID())
                        && i.getType().equalsIgnoreCase(interaction.getType()));

        if (!exists) {
            cache.getInteractions().add(interaction);
            redisService.set(key, cache, TTL_SECONDS, TimeUnit.SECONDS);
        }
    }

    public void flushAllCacheInteractions(String userId) {
        String key = redisService.key(PREFIX, userId);

        Optional<userModel> userOpt = userRepository.findByUserId(userId);
        if (userOpt.isEmpty()) {
            log.warn("⚠️ User not found for userId '{}'. Skipping.", userId);
            return;
        }

        userModel user = userOpt.get();
        UserInteractionCache cache = redisService.get(key,UserInteractionCache.class);
        if(cache == null || cache.getInteractions() == null || cache.getInteractions().isEmpty()){
            log.info("🚫 No interactions to flush for user '{}'", user.getUsername());
            redisService.deleteKey(key);
            return;
        }

        Map<String, Integer> tagMap = user.getTagInteractions() != null
                ? user.getTagInteractions()
                : new HashMap<>();

        for(Interaction interaction : cache.getInteractions()){
            int weight = weightForType(interaction.getType());
            for(String tag :interaction.getTags()){
                tagMap.merge(tag, weight, Integer::sum);
            }
        }

        user.setTagInteractions(tagMap);
        userRepository.save(user);
        redisService.deleteKey(key);
    }

    private int weightForType(String type){
        return switch (type.toLowerCase()){
            case "like" -> 5;
            case "save" -> 3;
            case "comment" -> 7;
            case "view" -> 1;
            default -> 0;
        };
    }

}
