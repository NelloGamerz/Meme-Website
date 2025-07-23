package com.example.Meme.Website.Scheduler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.Meme.Website.services.NotificationCleanupService;

@Component
public class NotificationCleanupScheduler {
    
    @Autowired
    public NotificationCleanupService cleanupService;

    @Scheduled(cron = "0 0 0 * * *")
    public void runScheduledCleanup(){
        cleanupService.deleteNotifiactionOlderThanDays(7);
        System.out.println("Cleaned up notifications older than a week");
    }
}
