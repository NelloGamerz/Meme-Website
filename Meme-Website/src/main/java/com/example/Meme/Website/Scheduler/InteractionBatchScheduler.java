package com.example.Meme.Website.Scheduler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.Meme.Website.batch.InteractionBatchBuffer;
import com.example.Meme.Website.models.UserInteraction;
import com.example.Meme.Website.repository.userInteractionsRepository;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.model.DeleteOneModel;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.Updates;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class InteractionBatchScheduler {

    @Autowired
    private InteractionBatchBuffer buffer;

    @Autowired
    private userInteractionsRepository interactionRepository;


    @Autowired
    private MongoTemplate mongoTemplate;

    @Scheduled(fixedRate = 5000)
    public void processbatches() {
        List<UserInteraction> inserts = buffer.drinInsertBatch();
        List<UserInteraction> deletes = buffer.drainDeleteBatch();
        Map<String, Integer> likeDeltas = buffer.drainLikeCountDelta();
        Map<String, Integer> saveDeltas = buffer.drainSaveCountDelta();
        Map<String, Integer> viewDeltas = buffer.drainViewCountDelta();
        Map<String, Integer> uploadDeltas = buffer.drainUploadCountDelta();
        Map<String, Map<String, Integer>> tagDeltas = buffer.drainUserTagDelta();

        if (!inserts.isEmpty()) {
            interactionRepository.saveAll(inserts);
            log.info("✅ Inserted {} interactions", inserts.size());
        }

        if (!deletes.isEmpty()) {
            List<DeleteOneModel<Document>> deleteOps = deletes.stream()
                    .map(interaction -> new DeleteOneModel<Document>(
                            Filters.and(
                                    Filters.eq("userId", interaction.getUserId()),
                                    Filters.eq("memeId", interaction.getMemeId()),
                                    Filters.eq("type", interaction.getType().toString()))))
                    .collect(Collectors.toList());

            mongoTemplate.getCollection("userInteractions").bulkWrite(deleteOps);
            log.info("🗑️ Bulk deleted {} interactions", deleteOps.size());
        }

        if (!likeDeltas.isEmpty()) {
            List<UpdateOneModel<Document>> likeUpdates = likeDeltas.entrySet().stream()
                    .map(e -> new UpdateOneModel<Document>(
                            Filters.eq("_id", new ObjectId(e.getKey())),
                            Updates.inc("likecount", e.getValue())))
                    .collect(Collectors.toList());

            BulkWriteResult likeResult = mongoTemplate.getCollection("memes").bulkWrite(likeUpdates);
            log.info("❤️ Updated likecount for {} memes", likeResult.getModifiedCount());
        }

        if (!saveDeltas.isEmpty()) {
            List<UpdateOneModel<Document>> saveUpdates = saveDeltas.entrySet().stream()
                    .map(e -> new UpdateOneModel<Document>(
                            Filters.eq("_id", new ObjectId(e.getKey())),
                            Updates.inc("saveCount", e.getValue())))
                    .collect(Collectors.toList());

            BulkWriteResult saveResult = mongoTemplate.getCollection("memes").bulkWrite(saveUpdates);
            log.info("💾 Updated savecount for {} memes", saveResult.getModifiedCount());
        }

        if (!viewDeltas.isEmpty()) {
            List<UpdateOneModel<Document>> viewUpdates = viewDeltas.entrySet().stream()
                    .map(e -> new UpdateOneModel<Document>(
                            Filters.eq("_id", new ObjectId(e.getKey())),
                            Updates.inc("viewCount", e.getValue())))
                    .collect(Collectors.toList());

            BulkWriteResult viewResult = mongoTemplate.getCollection("memes").bulkWrite(viewUpdates);
            log.info("👁️ Updated viewCount for {} memes", viewResult.getModifiedCount());
        }

        if (!uploadDeltas.isEmpty()) {
            List<UpdateOneModel<Document>> viewUpdates = viewDeltas.entrySet().stream()
                    .map(e -> new UpdateOneModel<Document>(
                            Filters.eq("_id", new ObjectId(e.getKey())),
                            Updates.inc("uploadCount", e.getValue())))
                    .collect(Collectors.toList());

            BulkWriteResult viewResult = mongoTemplate.getCollection("memes").bulkWrite(viewUpdates);
            log.info("👁️ Updated viewCount for {} memes", viewResult.getModifiedCount());
        }

        if (!tagDeltas.isEmpty()) {
            List<UpdateOneModel<Document>> tagUpdates = new ArrayList<>();

            for (Map.Entry<String, Map<String, Integer>> userEntry : tagDeltas.entrySet()) {
                String userId = userEntry.getKey();
                Map<String, Integer> tagMap = userEntry.getValue();

                Document incDoc = new Document();
                for (Map.Entry<String, Integer> tagEntry : tagMap.entrySet()) {
                    String tagField = "tagInteractions" + tagEntry.getKey();
                    incDoc.append(tagField, tagEntry.getValue());
                }

                Document updateDoc = new Document("$inc", incDoc);
                tagUpdates.add(new UpdateOneModel<>(
                        Filters.eq("userId", userId),
                        updateDoc));
            }

            BulkWriteResult tagResult = mongoTemplate.getCollection("userModel").bulkWrite(tagUpdates);
            log.info("🏷️ Updated tag interactions for {} users", tagResult.getModifiedCount());
        }
    }

}
