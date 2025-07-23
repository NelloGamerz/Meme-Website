package com.example.Meme.Website.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.Meme.Website.models.NotificationModel;

public interface notificationRepository extends MongoRepository<NotificationModel, String>{
    List<NotificationModel> findByReceiverUsernameAndIsReadFalse(String receiverUsername);
    List<NotificationModel> findByReceiverUsername(String receiverUsername);
    void deleteAllByMemeIdIn(List<String> memeIds);

    
}
