package com.example.Meme.Website.batch;

import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.springframework.stereotype.Component;

import com.example.Meme.Website.models.NotificationModel;

@Component
public class NotificationBatchBuffer {
    
    private final Queue<NotificationModel> notificationInsertQueue = new ConcurrentLinkedQueue<>();

    public void buffer(NotificationModel notification){
        notificationInsertQueue.offer(notification);
    }

    public List<NotificationModel> drainBatch(){
        List<NotificationModel> batch = new ArrayList<>();
        while(!notificationInsertQueue.isEmpty()){
            batch.add(notificationInsertQueue.poll());
        }
        return batch;
    }
}
