package com.example.Meme.Website.Scheduler;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.repository.notificationRepository;
import com.example.Meme.Website.repository.commentRepository;
import com.example.Meme.Website.repository.userInteractionsRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MemeCleanupService {
    
    private static final String REDIS_KEY = "memes:pending_cleanup";
    private static final int BATCH_SIZE = 20;

    @Autowired private RedisTemplate<String, String> redisTemplate;
    @Autowired private commentRepository commentRepository;
    @Autowired private userInteractionsRepository userInteractionRepository;
    @Autowired private notificationRepository notificationRepository;

    @Scheduled(fixedDelay = 10000)
    public void triggerCleanup() {
        asyncCleanupTask();
    }

    @Async
    public void asyncCleanupTask() {
        List<String> memeIds = new ArrayList<>();

        for (int i = 0; i < BATCH_SIZE; i++) {
            String memeId = redisTemplate.opsForList().leftPop(REDIS_KEY);
            if (memeId == null) break;
            memeIds.add(memeId);
        }

        if (memeIds.isEmpty()) return;

        try {
            log.info("🧹 [ASYNC] Cleaning up memeIds: {}", memeIds);

            commentRepository.deleteAllByMemeIdIn(memeIds);
            notificationRepository.deleteAllByMemeIdIn(memeIds);
            userInteractionRepository.deleteAllByMemeIdIn(memeIds);

            log.info("✅ Cleanup completed for memes: {}", memeIds);

        } catch (Exception e) {
            log.error("❌ Cleanup error: {}", e.getMessage());
            // Retry logic: push back to Redis
            memeIds.forEach(id -> redisTemplate.opsForList().rightPush(REDIS_KEY, id));
        }
    }
}
