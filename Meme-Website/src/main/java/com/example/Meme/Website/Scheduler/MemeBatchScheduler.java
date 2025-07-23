package com.example.Meme.Website.Scheduler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.Meme.Website.batch.MemeBatchBuffer;
import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.repository.memeRepository;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.model.UpdateOneModel;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class MemeBatchScheduler {

    @Autowired
    private MemeBatchBuffer buffer;
    @Autowired
    private memeRepository memeRepository;
    @Autowired
    private MongoTemplate mongoTemplate;

    @Scheduled(fixedDelay = 5000)
    public void processMemeUploads() {
        List<Meme> memeBatch = buffer.drainMemeBatch();
        List<Meme> memeDeleteBatch = buffer.drainMemeDeleteBatch();
        Map<String, Integer> uploadCountDeltas = buffer.drainUploaderUploadCountDelta();

        if (!memeBatch.isEmpty()) {
            memeRepository.saveAll(memeBatch);
            log.info("📥 Inserted {} memes in batch", memeBatch.size());
        }

        if (!memeDeleteBatch.isEmpty()) {
            memeRepository.deleteAll(memeDeleteBatch);
            log.info("📤 Deleted {} memes in batch", memeDeleteBatch.size());
        }

        if (!uploadCountDeltas.isEmpty()) {
            List<UpdateOneModel<Document>> uploadUpdates = new ArrayList<>();

            for (Map.Entry<String, Integer> entry : uploadCountDeltas.entrySet()) {
                String userId = entry.getKey();
                int delta = entry.getValue();

                if (delta == 0)
                    continue;

                // Prevent negative uploadCount
                Document query = new Document("_id", new ObjectId(userId));
                if (delta < 0) {
                    query.append("uploadCount", new Document("$gt", 0));
                }

                Document updateDoc = new Document("$inc", new Document("uploadCount", delta));
                uploadUpdates.add(new UpdateOneModel<>(query, updateDoc));
            }

            if (!uploadUpdates.isEmpty()) {
                BulkWriteResult result = mongoTemplate.getCollection("userModel").bulkWrite(uploadUpdates);
                log.info("📊 Updated uploadCount for {} users", result.getModifiedCount());
            }
        }

    }
}
