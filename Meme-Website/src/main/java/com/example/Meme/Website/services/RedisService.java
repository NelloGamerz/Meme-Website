package com.example.Meme.Website.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.models.Meme;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class RedisService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public <T> T get(String key, Class<T> entityClass) {
        try {
            Object o = redisTemplate.opsForValue().get(key);
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(o.toString(), entityClass);
        } catch (Exception e) {
            log.error("Exception " + e);
            return null;
        }
    }

    public void set(String key, Object o, long time, TimeUnit unit) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonValue = objectMapper.writeValueAsString(o);
            redisTemplate.opsForValue().set(key, jsonValue, unit.toSeconds(time), TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("Exception while saving to Redis: " + e.getMessage());
        }
    }

    public <T> List<T> getList(String key, Class<T> clazz) {
        Object obj = redisTemplate.opsForValue().get(key);

        if (obj == null) {
            System.out.println("🚫 Redis key '" + key + "' not found.");
            return new ArrayList<>();
        }

        if (!(obj instanceof String)) {
            System.out.println("❌ Expected JSON string but found: " + obj.getClass());
            return new ArrayList<>();
        }

        String json = (String) obj;

        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, clazz));
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public void setToken(String keyPrefix, String username, String token, long expirySecond) {
        try {
            String key = key(keyPrefix, username);
            redisTemplate.opsForValue().set(key, token, expirySecond, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Error setting token in Redis for user '{}': {}", username, e.getMessage());
        }
    }

    public String getToken(String keyPrefix, String username) {
        try {
            String key = key(keyPrefix, username);
            Object token = redisTemplate.opsForValue().get(key);
            return token != null ? token.toString() : null;
        } catch (Exception e) {
            log.error("Error getting token from Redis for user '{}': {}", username, e.getMessage());
            return null;
        }
    }

    public void deleteToken(String keyPrefix, String username) {
        try {
            String key = key(keyPrefix, username);
            redisTemplate.delete(key);
            log.info("Token deleted for user '{}'", username);
        } catch (Exception e) {
            log.error("Error deleting token from Redis for user '{}': {}", username, e.getMessage());
        }
    }

    public void deleteKey(String key) {
        try {
            redisTemplate.delete(key);
            log.info("Key '{}' deleted from Redis", key);
        } catch (Exception e) {
            log.error("Error deleting key '{}' from Redis: {}", key, e.getMessage());
        }
    }

    public boolean tokenExists(String keyPrefix, String username) {
        try {
            String key = key(keyPrefix, username);
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("🔴 Error checking token in Redis: {}", e.getMessage());
            return false;
        }

    }

    public String key(String Prefix, String Suffix) {
        return Prefix + ":" + Suffix;
    }

    public void cacheMemesList(String key, List<Meme> memes, long ttl, TimeUnit unit) {
        try {
            String json = objectMapper.writeValueAsString(memes);
            redisTemplate.opsForValue().set(key, json, ttl, unit);
            log.info("✅ Cached memes list to Redis with key '{}'", key);
        } catch (JsonProcessingException e) {
            log.error("❌ Failed to cache memes list to Redis: {}", e.getMessage());
        }
    }

    public boolean hasKey(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("❌ Error checking Redis key '{}': {}", key, e.getMessage());
            return false;
        }
    }

    public long getTtlSeconds(String key) {
        try {
            return redisTemplate.getExpire(key, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("❌ Error fetching TTL for Redis key '{}': {}", key, e.getMessage());
            return -1;
        }
    }

    public String generateMemeCacheKey(String memeId, String userId, int skip, int limit) {
        return String.format("more_memes:%s:%s:%d:%d", userId, memeId, skip, limit);
    }

    public void pushMemeToCleanupQueue(String memeId) {
        try {
            String redisListKey = "memes:pending_cleanup";
            redisTemplate.opsForList().rightPush(redisListKey, memeId);
            log.info("🧹 Meme '{}' pushed to cleanup queue '{}'", memeId, redisListKey);
        } catch (Exception e) {
            log.error("❌ Failed to push meme '{}' to cleanup queue: {}", memeId, e.getMessage());
        }
    }

    public String getStringValue(String key) {
        try {
            return redisTemplate.opsForValue().get(key).toString();
        } catch (Exception e) {
            log.error("Failed to fetch String value from redis.");
            return null;
        }
    }

    public void setStringValue(String key, String value, Long ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.error("Failed to set String value in redis.");
        }
    }

    public void pushAllToList(String key, List<String> values, long ttl) {
        try {
            if (values != null && !values.isEmpty()) {
                redisTemplate.opsForList().rightPushAll(key, values);
                redisTemplate.expire(key, ttl, TimeUnit.MINUTES);
                log.info("✅ Pushed {} values to Redis list '{}' with TTL", values.size(), key);
            }
        } catch (Exception e) {
            log.error("❌ Failed to push list to Redis: {}", e.getMessage());
        }
    }

    public void putHashFields(String key, Map<String, String> fields) {
        try {
            redisTemplate.opsForHash().putAll(key, fields);
        } catch (Exception e) {
            log.error("❌ Failed to store fields in Redis hash '{}': {}", key, e.getMessage());
        }
    }

    public String getHashFieldValue(String key, String field) {
        try {
            Object value = redisTemplate.opsForHash().get(key, field);
            return value != null ? value.toString() : null;
        } catch (Exception e) {
            log.error("❌ Failed to get field '{}' from Redis hash '{}': {}", field, key, e.getMessage());
            return null;
        }
    }

    public Map<String, String> getAllHash(String key) {
        Map<Object, Object> rawMap = redisTemplate.opsForHash().entries(key);

        return rawMap.entrySet()
                .stream()
                .collect(Collectors.toMap(
                        e -> String.valueOf(e.getKey()),
                        e -> String.valueOf(e.getValue())));
    }

}

