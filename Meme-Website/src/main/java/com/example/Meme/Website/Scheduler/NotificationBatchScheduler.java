package com.example.Meme.Website.Scheduler;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.Meme.Website.WebSockets.WebSocketSessionManager;
import com.example.Meme.Website.batch.NotificationBatchBuffer;
import com.example.Meme.Website.models.NotificationModel;
import com.example.Meme.Website.repository.notificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class NotificationBatchScheduler {

    @Autowired
    private NotificationBatchBuffer notificationBatchBuffer;
    @Autowired
    private notificationRepository notificationRepository;
    @Autowired
    private ObjectMapper objectMapper;

    @Scheduled(fixedRate = 5000)
    public void processBufferedNotifications() {
        List<NotificationModel> notifications = notificationBatchBuffer.drainBatch();
        
        if(!notifications.isEmpty()){
            notificationRepository.saveAll(notifications);
            for(NotificationModel notification : notifications){
                try{
                    String json = objectMapper.writeValueAsString(notification);
                    WebSocketSessionManager.sendToUser(notification.getReceiverUsername(), json);
                }
                catch(Exception e){
                    e.printStackTrace();
                }
            }
            log.info("📣 Sent {} batched notifications", notifications.size());
        }
    }
}
