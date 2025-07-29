package com.example.Meme.Website.Scheduler;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.Meme.Website.batch.FollowBatchBuffer;
import com.example.Meme.Website.models.FollowersModel;
import com.example.Meme.Website.repository.followersRepository;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.Updates;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class FollowBatchScheduler {

    @Autowired
    private FollowBatchBuffer followerBatchBuffer;
    @Autowired
    private followersRepository followersRepository;
    @Autowired
    private MongoTemplate mongoTemplate;

    @Scheduled(fixedRate = 5000)
    public void processFollowerBatches() {
        List<FollowersModel> inserts = followerBatchBuffer.drainFollowInsert();
        List<FollowersModel> deletes = followerBatchBuffer.drainFollowDelete();
        Map<String, Integer> followerDeltas = followerBatchBuffer.drainFollowerDeltas();
        Map<String, Integer> followingDeltas = followerBatchBuffer.drainFollowingDeltas();

        if (!inserts.isEmpty()) {
            followersRepository.saveAll(inserts);
            log.info("Added {} followers", inserts.size());
        }

        if (!deletes.isEmpty()) {
            for (FollowersModel model : deletes) {
                followersRepository.deleteByFollowerUserIdAndFollowedUserId(
                        model.getFollowerUserId(), model.getFollowedUserId());
            }
            log.info("Removed {} followers", deletes.size());
        }

        if (!followerDeltas.isEmpty()) {
            List<UpdateOneModel<Document>> followerUpdates = followerDeltas.entrySet().stream()
                    .map(entry -> new UpdateOneModel<Document>(
                            Filters.eq("_id", new ObjectId(entry.getKey())),
                            Updates.inc("followersCount", entry.getValue())))
                    .collect(Collectors.toList());

            mongoTemplate.getCollection("Users").bulkWrite(followerUpdates);
            log.info("Updated followersCount for {} users", followerUpdates.size());
        }

        if (!followingDeltas.isEmpty()) {
            List<UpdateOneModel<Document>> followingUpdates = followingDeltas.entrySet().stream()
                    .map(entry -> new UpdateOneModel<Document>(
                            Filters.eq("_id", new ObjectId(entry.getKey())),
                            Updates.inc("followingCount", entry.getValue())))
                    .collect(Collectors.toList());

            mongoTemplate.getCollection("Users").bulkWrite(followingUpdates);
            log.info("Updated followingCount for {} users", followingUpdates.size());
        }

    }

}
