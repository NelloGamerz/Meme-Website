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

import com.example.Meme.Website.batch.CommentBatchBuffer;
import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.repository.commentRepository;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.Updates;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CommentBatchScheduler {
    
    @Autowired
    private CommentBatchBuffer commentBatchBuffer;
    @Autowired
    private commentRepository commentRepository;
    @Autowired
    private MongoTemplate mongoTemplate;

    @Scheduled(fixedRate = 5000)
    public void processCommentbatch(){
        List<Comments> comments = commentBatchBuffer.drainComments();
        Map<String, Integer> commentDeltas = commentBatchBuffer.drainCommentDeltas();

        if(!comments.isEmpty()){
            commentRepository.saveAll(comments);
            log.info("💬 Saved {} comments in batch", comments.size());
        }

        if(!commentDeltas.isEmpty()){
            List<UpdateOneModel<Document>> updates = commentDeltas.entrySet().stream()
                .map(entry -> new UpdateOneModel<Document>(
                    Filters.eq("_id", new ObjectId(entry.getKey())),
                    Updates.inc("commentsCount", entry.getValue())
                ))
                .collect(Collectors.toList());

            mongoTemplate.getCollection("memes").bulkWrite(updates);
            log.info("🔁 Updated commentCount for {} memes", updates.size());
        }
    }
}
