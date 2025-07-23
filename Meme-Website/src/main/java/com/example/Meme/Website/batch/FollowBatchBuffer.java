package com.example.Meme.Website.batch;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.springframework.stereotype.Component;

import com.example.Meme.Website.models.FollowersModel;

import lombok.Data;

@Component
@Data
public class FollowBatchBuffer {
    private final Queue<FollowersModel> followInsertQueue = new ConcurrentLinkedQueue<>();
    private final Queue<FollowersModel> followDeleteQueue = new ConcurrentLinkedQueue<>();

    private final Map<String, Integer> userFollowersCountDelta = new ConcurrentHashMap<>();
    private final Map<String, Integer> userFollowingCountDelta = new ConcurrentHashMap<>();

    public void bufferFollow(FollowersModel model) {
        followInsertQueue.offer(model);
        userFollowersCountDelta.merge(model.getFollowedUserId(), 1, Integer::sum);
        userFollowingCountDelta.merge(model.getFollowerUserId(), 1, Integer::sum);
    }

    public void bufferUnfollow(FollowersModel model) {
        followDeleteQueue.offer(model);
        userFollowersCountDelta.merge(model.getFollowedUserId(), -1, Integer::sum);
        userFollowingCountDelta.merge(model.getFollowerUserId(), -1, Integer::sum);
    }

    public List<FollowersModel> drainFollowInsert() {
        List<FollowersModel> batch = new ArrayList<>();
        while (!followInsertQueue.isEmpty()) {
            batch.add(followInsertQueue.poll());
        }
        return batch;
    }

    public List<FollowersModel> drainFollowDelete() {
        List<FollowersModel> batch = new ArrayList<>();
        while (!followDeleteQueue.isEmpty()) {
            batch.add(followDeleteQueue.poll());
        }
        return batch;
    }

    public Map<String, Integer> drainFollowerDeltas() {
        Map<String, Integer> copy = new HashMap<>(userFollowersCountDelta);
        userFollowersCountDelta.clear();
        return copy;
    }

    public Map<String, Integer> drainFollowingDeltas() {
        Map<String, Integer> copy = new HashMap<>(userFollowingCountDelta);
        userFollowingCountDelta.clear();
        return copy;
    }
}
