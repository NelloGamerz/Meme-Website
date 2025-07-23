package com.example.Meme.Website.batch;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.springframework.stereotype.Component;

import com.example.Meme.Website.models.Comments;

@Component
public class CommentBatchBuffer {

    private final Queue<Comments> commentQueue = new ConcurrentLinkedQueue<>();
    private final Map<String, Integer> memeCommentCountDeltas = new ConcurrentHashMap<>();

    public void bufferComment(Comments comment) {
        commentQueue.offer(comment);
        memeCommentCountDeltas.merge(comment.getMemeId(), 1, Integer::sum);
    }

    public List<Comments> drainComments() {
        List<Comments> batch = new ArrayList<>();
        while (!commentQueue.isEmpty()) {
            batch.add(commentQueue.poll());
        }
        return batch;
    }

    public Map<String, Integer> drainCommentDeltas() {
        Map<String, Integer> drained = new HashMap<>(memeCommentCountDeltas);
        memeCommentCountDeltas.clear();
        return drained;
    }
}
