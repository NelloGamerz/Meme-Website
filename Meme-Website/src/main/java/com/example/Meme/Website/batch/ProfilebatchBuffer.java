// package com.example.Meme.Website.batch;

// import java.util.Collections;
// import java.util.Map;
// import java.util.Set;
// import java.util.concurrent.ConcurrentHashMap;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.data.redis.core.RedisTemplate;
// import org.springframework.stereotype.Component;


// @Component
// public class ProfilebatchBuffer {

//     @Autowired
//     private RedisTemplate<String, String> redisTemplate;

//     private final Map<String, String> profilePictureUpdates = new ConcurrentHashMap<>();
//     private final Map<String, String> profileBannerUpdates = new ConcurrentHashMap<>();
//     private final Map<String, String> usernameUpdates = new ConcurrentHashMap<>();

//     private static final String REDIS_KEY = "profile:pending:updates";

//     public void bufferProfilePicture(String userId, String url) {
//         profilePictureUpdates.put(userId, url);
//     }

//     public void bufferProfileBanner(String userId, String url) {
//         profileBannerUpdates.put(userId, url);
//     }

//     public void bufferUsername(String userId, String newUsername) {
//         usernameUpdates.put(userId, newUsername);
//     }

//     public void markUserIdForPropagation(String userId) {
//         redisTemplate.opsForSet().add(REDIS_KEY, userId);
//     }

//     public Set<String> drainMarkedUserIds() {
//         Set<String> userIds = redisTemplate.opsForSet().members(REDIS_KEY);
//         if (userIds != null && !userIds.isEmpty()) {
//             redisTemplate.delete(REDIS_KEY);
//         }
//         return userIds != null ? userIds : Collections.emptySet();
//     }

//     public Map<String, String> getProfilePictureUpdates() {
//         return profilePictureUpdates;
//     }

//     public Map<String, String> getProfileBannerUpdates() {
//         return profileBannerUpdates;
//     }

//     public Map<String, String> getUsernameUpdates() {
//         return usernameUpdates;
//     }

//     public void clear() {
//         profilePictureUpdates.clear();
//         profileBannerUpdates.clear();
//         usernameUpdates.clear();
//     }
// }



package com.example.Meme.Website.batch;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ProfilebatchBuffer {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    // Key pattern: profile:update:<userId>:<field>
    private String getKey(String userId, String field) {
        return "profile:update:" + userId + ":" + field;
    }

    public void bufferProfilePicture(String userId, String url) {
        redisTemplate.opsForValue().set(getKey(userId, "picture"), url);
    }

    public void bufferProfileBanner(String userId, String url) {
        redisTemplate.opsForValue().set(getKey(userId, "banner"), url);
    }

    public void bufferUsername(String userId, String username) {
        redisTemplate.opsForValue().set(getKey(userId, "username"), username);
    }

    public Map<String, String> drainProfileUpdates(String userId) {
        Map<String, String> updates = new HashMap<>();

        String pic = redisTemplate.opsForValue().get(getKey(userId, "picture"));
        String banner = redisTemplate.opsForValue().get(getKey(userId, "banner"));
        String username = redisTemplate.opsForValue().get(getKey(userId, "username"));

        if (pic != null) updates.put("profilePictureUrl", pic);
        if (banner != null) updates.put("profileBannerUrl", banner);
        if (username != null) updates.put("username", username);

        // Delete Redis keys after draining
        redisTemplate.delete(Arrays.asList(
                getKey(userId, "picture"),
                getKey(userId, "banner"),
                getKey(userId, "username")
        ));

        return updates;
    }

    public Set<String> getMarkedUserIds() {
        Set<String> keys = redisTemplate.keys("profile:update:*");
        if (keys == null || keys.isEmpty()) return Collections.emptySet();

        // Extract userId from keys like profile:update:<userId>:<field>
        Set<String> userIds = new HashSet<>();
        for (String key : keys) {
            String[] parts = key.split(":");
            if (parts.length == 4) {
                userIds.add(parts[2]); // <userId>
            }
        }
        return userIds;
    }

    public void clearAllForUser(String userId) {
        redisTemplate.delete(Arrays.asList(
                getKey(userId, "picture"),
                getKey(userId, "banner"),
                getKey(userId, "username")
        ));
    }
}
