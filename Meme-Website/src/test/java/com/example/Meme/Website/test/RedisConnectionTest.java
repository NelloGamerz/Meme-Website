package com.example.Meme.Website.test;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RedisConnectionTest {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Test
    void testRedisConnection() {
        try {
            String pong = redisTemplate.getConnectionFactory().getConnection().ping();
            System.out.println("✅ Redis is reachable: " + pong);
            assertEquals("PONG", pong, "Redis should respond with PONG");
        } catch (Exception e) {
            fail("❌ Cannot connect to Redis: " + e.getMessage());
        }
    }
}

