package com.example.Meme.Website.services;

import java.util.Calendar;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.models.NotificationModel;
import com.mongodb.client.result.DeleteResult;

@Service
public class NotificationCleanupService {

    @Autowired
    private MongoTemplate mongoTemplate;

    public void deleteNotifiactionOlderThanDays(int days){
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_MONTH, -days);
        Date cutOffDate = calendar.getTime();

        Query query = new Query(Criteria.where("createdAt").lt(cutOffDate));
        DeleteResult result = mongoTemplate.remove(query, NotificationModel.class);
        System.out.println("✅ Deleted " + result.getDeletedCount() + " notifications older than " + days + " days");
    }
}
