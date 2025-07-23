package com.example.Meme.Website.Scheduler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.Meme.Website.services.TrendingCacheService;

@Component
public class CacheWarmupScheduler {
    @Autowired
    private TrendingCacheService trendingCacheService;

    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void warmupTrendingMemes(){
        System.out.println("[CRON] Refreshing Trending memes cache...");
        trendingCacheService.refreshTrendingMemes();
    }
}
