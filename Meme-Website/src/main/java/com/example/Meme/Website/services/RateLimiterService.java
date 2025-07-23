package com.example.Meme.Website.services;

import java.time.Instant;
import java.util.Collections;

import org.redisson.api.RedissonClient;
import org.redisson.client.codec.StringCodec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.Properties.RateLimitProperties;
import com.example.Meme.Website.config.RateLimitConfig;

@Service
public class RateLimiterService {

    @Autowired
    private RedissonClient redissonClient;
    @Autowired
    private RateLimitConfig rateLimitConfig;

    private static final String LUA_SCRIPT = """
                    local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local refill_rate = tonumber(ARGV[2])
            local max_tokens = tonumber(ARGV[3])

            local bucket = redis.call("HMGET", key, "tokens", "last_refill")
            local tokens = tonumber(bucket[1])
            local last_refill = tonumber(bucket[2])

            if tokens == nil or last_refill == nil then
                tokens = max_tokens
                last_refill = now
            end

            local elapsed = now - last_refill
            local refill = math.floor(elapsed * refill_rate)

            if refill > 0 then
                tokens = math.min(tokens + refill, max_tokens)
                last_refill = now
            end

            if tokens > 0 then
                tokens = tokens - 1
                redis.call("HMSET", key, "tokens", tokens, "last_refill", last_refill)
                redis.call("EXPIRE", key, 120)
                return 1
            else
                return 0
            end
                """;

    // public boolean isAllowed(String bucketType, String userId) {
    // RateLimitProperties.Limit limit = rateLimitConfig.getLimit(bucketType);
    // return isAllowed("rate:" + bucketType + ":" + userId, limit.getMaxTokens(),
    // 1 / Math.max(limit.getRefillRatePerSec(), 1));
    // }

    public boolean isAllowed(String bucketType, String userId) {
        RateLimitProperties.Limit limit = rateLimitConfig.getLimit(bucketType);
        int refillRatePerSec = Math.max(limit.getRefillRatePerSec(), 1); // Ensure non-zero
        return isAllowed("rate:" + bucketType + ":" + userId, limit.getMaxTokens(), refillRatePerSec);
    }

    public boolean isAllowed(String key, int maxTokens, int refillIntervalSeconds) {
        String redisKey = key;
        long now = Instant.now().getEpochSecond();

        Number result = redissonClient.getScript(StringCodec.INSTANCE)
                .eval(org.redisson.api.RScript.Mode.READ_WRITE,
                        LUA_SCRIPT,
                        org.redisson.api.RScript.ReturnType.INTEGER,
                        Collections.singletonList(redisKey),
                        now,
                        refillIntervalSeconds,
                        maxTokens);

        return result != null && result.intValue() == 1;
    }

    public long getRetryAfter(String bucketType, String userId) {
        String redisKey = "rate:" + bucketType + ":" + userId;
        var bucket = redissonClient.getMap(redisKey, StringCodec.INSTANCE);

        String tokenStr = (String) bucket.get("tokens");
        String lastRefillStr = (String) bucket.get("last_refill");

        if (tokenStr == null || lastRefillStr == null) {
            return 60;
        }

        int tokens = Integer.parseInt(tokenStr);
        long lastRefill = Long.parseLong(lastRefillStr);
        long now = Instant.now().getEpochSecond();

        if (tokens > 0)
            return 0;

        long elapsed = now - lastRefill;
        long interval = 60;
        return Math.max(1, interval - (elapsed % interval));
    }
}
