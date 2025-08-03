package com.example.Meme.Website.batch;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.springframework.stereotype.Component;

import com.example.Meme.Website.models.Meme;

@Component
public class MemeBatchBuffer {
    
    private final Queue<Meme> memeInsertQueue = new ConcurrentLinkedQueue<>();
    private final Queue<Meme> memeDeleteQueue = new ConcurrentLinkedQueue<>();
    private final Map<String, Integer> uploaderUploadCountDelta = new ConcurrentHashMap<>();

    public void bufferMemeInsert(Meme meme){
        memeInsertQueue.offer(meme);
        uploaderUploadCountDelta.merge(meme.getUserId(), 1, Integer::sum);
    }

    public void bufferMemeDelete(Meme meme){
        memeDeleteQueue.offer(meme);
        uploaderUploadCountDelta.merge(meme.getUserId(), -1, Integer::sum);
    }

    public List<Meme> drainMemeBatch(){
        List<Meme> batch = new ArrayList<>();
        while(!memeInsertQueue.isEmpty()){
            batch.add(memeInsertQueue.poll());
        }

        return batch;
    }

    public List<Meme> drainMemeDeleteBatch(){
        List<Meme> batch = new ArrayList<>();
        while(!memeDeleteQueue.isEmpty()){
            batch.add(memeDeleteQueue.poll());
        }

        return batch;
    }

    public Map<String, Integer> drainUploaderUploadCountDelta() {
        Map<String, Integer> drained = new HashMap<>(uploaderUploadCountDelta);
        uploaderUploadCountDelta.clear();
        return drained;
    }
}
