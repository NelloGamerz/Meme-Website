package com.example.Meme.Website.batch;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.springframework.stereotype.Component;

import com.example.Meme.Website.models.UserInteraction;

@Component
public class InteractionBatchBuffer {

    private final Queue<UserInteraction> interactionInsertQueue = new ConcurrentLinkedQueue<>();
    private final Queue<UserInteraction> interactionDeleteQueue = new ConcurrentLinkedQueue<>();

    private final Map<String, Integer> memeLikeCountDelta = new ConcurrentHashMap<>();
    private final Map<String, Integer> memeSaveCountDelta = new ConcurrentHashMap<>();
    private final Map<String, Integer> memeViewCountDelta = new ConcurrentHashMap<>();
    private final Map<String, Integer> memeUploadCountDelta = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Integer>> userTagDelta = new ConcurrentHashMap<>();

    public void bufferInsert(UserInteraction interaction) {
        interactionInsertQueue.offer(interaction);
        switch (interaction.getType()) {
            case LIKE -> memeLikeCountDelta.merge(interaction.getMemeId(), 1, Integer::sum);
            case SAVE -> memeSaveCountDelta.merge(interaction.getMemeId(), 1, Integer::sum);
            case VIEW -> memeViewCountDelta.merge(interaction.getMemeId(), 1, Integer::sum);
            case UPLOAD -> memeUploadCountDelta.merge(interaction.getMemeId(), 1, Integer::sum);
            default -> throw new IllegalArgumentException("Unexpected value: " + interaction.getType());
        }
    }

    public void bufferDelete(UserInteraction interaction) {
        interactionDeleteQueue.offer(interaction);
        switch (interaction.getType()) {
            case LIKE -> memeLikeCountDelta.merge(interaction.getMemeId(), -1, Integer::sum);
            case SAVE -> memeSaveCountDelta.merge(interaction.getMemeId(), -1, Integer::sum);
            case VIEW -> memeViewCountDelta.merge(interaction.getMemeId(), -1, Integer::sum);
            case UPLOAD -> memeUploadCountDelta.merge(interaction.getMemeId(), -1, Integer::sum);
            default -> throw new IllegalArgumentException("Unexpected value: " + interaction.getType());
        }
    }

    public List<UserInteraction> drinInsertBatch() {
        List<UserInteraction> batch = new ArrayList<>();
        while (!interactionInsertQueue.isEmpty()) {
            batch.add(interactionInsertQueue.poll());
        }
        return batch;
    }

    public List<UserInteraction> drainDeleteBatch() {
        List<UserInteraction> batch = new ArrayList<>();
        while (!interactionDeleteQueue.isEmpty()) {
            batch.add(interactionDeleteQueue.poll());
        }
        return batch;
    }

    public Map<String, Integer> drainUploadCountDelta() {
        Map<String, Integer> drained = new HashMap<>(memeUploadCountDelta);
        memeUploadCountDelta.clear();
        return drained;
    }   

    public Map<String, Integer> drainLikeCountDelta() {
        Map<String, Integer> drained = new HashMap<>(memeLikeCountDelta);
        memeLikeCountDelta.clear();
        return drained;
    }

    public Map<String, Integer> drainSaveCountDelta() {
        Map<String, Integer> drained = new HashMap<>(memeSaveCountDelta);
        memeSaveCountDelta.clear();
        return drained;
    }

    public Map<String, Integer> drainViewCountDelta(){
        Map<String, Integer> drained = new HashMap<>(memeViewCountDelta);
        memeViewCountDelta.clear();
        return drained; 
    }

    public Map<String, Map<String, Integer>> drainUserTagDelta(){
        Map<String, Map<String, Integer>> drained = new HashMap<>(userTagDelta);
        userTagDelta.clear();
        return drained;
    }

    public void bufferTagInteraction(String userId, List<String> tags) {
        if (tags == null || tags.isEmpty()) return;

        userTagDelta.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());
        Map<String, Integer> tagMap = userTagDelta.get(userId);

        for (String tag : tags) {
            tagMap.merge(tag, 1, Integer::sum);
        }
    }


}
