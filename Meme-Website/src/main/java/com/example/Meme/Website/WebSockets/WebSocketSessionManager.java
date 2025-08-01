package com.example.Meme.Website.WebSockets;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.memeRepository;
import com.example.Meme.Website.repository.userRepository;

@Component
public class WebSocketSessionManager {

    @Autowired
    private userRepository userRepository;
    @Autowired
    private memeRepository memeRepository;

    private static final Map<String, WebSocketSession> userSession = new ConcurrentHashMap<>();
    private static final Map<String, Set<WebSocketSession>> postSession = new ConcurrentHashMap<>();

    public Set<String> getAllActiveUsersId() {
        return userSession.keySet();
    }

    public static void registerUserSession(String userId, WebSocketSession session) {
        userSession.put(userId, session);
    }

    public static WebSocketSession getSession(String userId) {
        return userSession.get(userId);
    }

    public static void removeUserSession(WebSocketSession session) {
        userSession.entrySet().removeIf(entry -> entry.getValue().getId().equals(session.getId()));
    }

    public boolean hasUserSession(String userId) {
        return userSession.containsKey(userId);
    }

    public static void sendToUser(String username, String message) throws IOException {
        WebSocketSession session = userSession.get(username);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new org.springframework.web.socket.TextMessage(message));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public static Set<WebSocketSession> getPostSessions(String postId) {
        return postSession.getOrDefault(postId, Collections.emptySet());
    }

    public void registerPostSession(String postId, WebSocketSession session) {
        postSession.computeIfAbsent(postId, k -> ConcurrentHashMap.newKeySet()).add(session);

        Object userIdObject = session.getAttributes().get("userId");
        if (userIdObject == null) {
            System.out.println("User ID is null, skipping view count increment for postId: " + postId);
            return;
        }

        String userId = userIdObject.toString();
        Optional<userModel> userOpt = userRepository.findByUserId(userId);

        if (userOpt.isEmpty()) {
            System.out.println("User not found for userId: " + userId);
            return;
        }

        userModel user = userOpt.get();

        boolean tagsUpdated = false;

        Optional<Meme> memeOpt = memeRepository.findById(postId);
        if (memeOpt.isEmpty()) {
            System.out.println("Meme not found for postId: " + postId);
            return;
        }

        Meme meme = memeOpt.get();

        // Increment view count only on first view
        meme.setViewCount(meme.getViewCount() + 1);
        memeRepository.save(meme);
        System.out.println("Incremented viewCount for postId: " + postId);

        List<String> tags = meme.getTags();
        if (tags != null && !tags.isEmpty()) {
            if (user.getTagInteractions() == null) {
                user.setTagInteractions(new HashMap<>());
            }

            Map<String, Integer> tagMap = user.getTagInteractions();
            for (String tag : tags) {
                tagMap.put(tag, tagMap.getOrDefault(tag, 0) + 1);
                tagsUpdated = true;
            }

            System.out.println("Updated tag interactions for userId: " + userId + " => "
                    + tagMap);
        }

        // Save user if any change was made
        if (tagsUpdated) {
            userRepository.save(user);
            System.out.println("Saved user due to seenMemes or tagInteractions update: "
                    + userId);
        }
    }

    public void removePostSession(String postId, WebSocketSession session) {
        Set<WebSocketSession> sessions = postSession.get(postId);
        if (sessions != null) {
            sessions.remove(session);

            if (sessions.isEmpty()) {
                postSession.remove(postId);
            }
        } else {
        }
    }

    public static void broadcastToPost(String postId, String message) {
        Set<WebSocketSession> sessions = postSession.get(postId);
        if (sessions != null) {
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(new org.springframework.web.socket.TextMessage(message));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }

    public static boolean hasPostViewers(String postId) {
        Set<WebSocketSession> sessions = postSession.get(postId);
        return sessions != null && !sessions.isEmpty();
    }

    public static void removeSessions(WebSocketSession session) {
        userSession.entrySet().removeIf(entry -> entry.getValue().getId().equals(session.getId()));

        postSession.entrySet().removeIf(entry -> {
            Set<WebSocketSession> sessions = entry.getValue();
            sessions.remove(session);
            return sessions.isEmpty();
        });
    }
}
