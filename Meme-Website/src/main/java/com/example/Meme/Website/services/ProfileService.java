package com.example.Meme.Website.services;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Meme.Website.DBO.MemeIdDBO;
import com.example.Meme.Website.DBO.UserSummary;
import com.example.Meme.Website.Security.CookieUtil;
import com.example.Meme.Website.batch.FollowBatchBuffer;
import com.example.Meme.Website.batch.NotificationBatchBuffer;
import com.example.Meme.Website.dto.MemeDto;
import com.example.Meme.Website.dto.MemeFeedResponse;
import com.example.Meme.Website.models.ActionType;
import com.example.Meme.Website.models.FollowersModel;
import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.models.NotificationModel;
import com.example.Meme.Website.models.UserInteraction;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;
import com.example.Meme.Website.repository.memeRepository;
import com.example.Meme.Website.repository.userInteractionsRepository;
import com.example.Meme.Website.repository.followersRepository;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ProfileService {

    @Autowired
    private userRepository userRepository;

    @Autowired
    private memeRepository memeRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private JWTService jwtService;

    @Autowired
    private CookieUtil cookieUtil;

    @Autowired
    private RedisService redisService;

    @Autowired
    private followersRepository followersRepository;

    @Autowired
    private userInteractionsRepository userInteractionRepository;

    @Autowired
    private FollowBatchBuffer followerBatchBuffer;

    @Autowired
    private NotificationBatchBuffer notificationBatchBuffer;

    @Transactional
    public void updateProfilePictureInFollowersAndFollowing(String userId, String newProfilePictureUrl) {
        Query followersQuery = new Query(Criteria.where("Followers.userId").is(userId));

        Update followersUpdate = new Update()
                .set("Followers.$[elem].profilePictureUrl", newProfilePictureUrl)
                .filterArray(Criteria.where("elem.userId").is(userId)); // Correct way to apply array filter

        mongoTemplate.updateMulti(followersQuery, followersUpdate, userModel.class);

        Query followingQuery = new Query(Criteria.where("Following.userId").is(userId));
        Update followingUpdate = new Update()
                .set("Following.$[elem].profilePictureUrl", newProfilePictureUrl)
                .filterArray(Criteria.where("elem.userId").is(userId));
        mongoTemplate.updateMulti(followingQuery, followingUpdate, userModel.class);
    }

    @Transactional
    public ResponseEntity<?> userProfile(String username) {
        Optional<userModel> optionalProfileUser = userRepository.findByUsername(username);
        if (optionalProfileUser.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        userModel profileUser = optionalProfileUser.get();

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        Optional<userModel> optionalCurrentUser = userRepository.findByUsername(currentUsername);

        if (optionalCurrentUser.isEmpty()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        userModel currentUser = optionalCurrentUser.get();

        Map<String, Object> userProfile = new HashMap<>();
        userProfile.put("username", profileUser.getUsername());
        userProfile.put("profilePictureUrl", profileUser.getProfilePictureUrl());
        userProfile.put("profileBannerUrl", profileUser.getProfileBannerUrl());
        userProfile.put("followingCount", profileUser.getFollowingCount());
        userProfile.put("followersCount", profileUser.getFollowersCount());
        userProfile.put("uploadCount", profileUser.getUploadCount());

        if (currentUser.getUserId().equals(profileUser.getUserId())) {
            userProfile.put("isOwnProfile", true);
        } else {
            String currentUserId = currentUser.getUserId();
            String profileUserId = profileUser.getUserId();

            boolean isFollowing = followersRepository.existsByFollowerUserIdAndFollowedUserId(currentUserId,
                    profileUserId);
            boolean isFollowedBy = followersRepository.existsByFollowerUserIdAndFollowedUserId(profileUserId,
                    currentUserId);

            userProfile.put("isOwnProfile", false);
            userProfile.put("followed", isFollowing);
            userProfile.put("followback", isFollowedBy);
        }

        return ResponseEntity.ok(userProfile);
    }

    @Transactional
    public ResponseEntity<?> changeUsername(String userId, Map<String, String> request,
            HttpServletResponse httpResponse) {
        Optional<userModel> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found."));
        }

        userModel user = userOpt.get();
        String previousUsername = user.getUsername();
        String newUsername = request.get("newUsername");

        if (newUsername == null || newUsername.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "New username cannot be empty."));
        }

        if (!newUsername.equals(previousUsername) && userRepository.existsByUsername(newUsername)) {
            return ResponseEntity.status(400).body(Map.of("error", "Username already taken."));
        }

        user.setUsername(newUsername);
        userRepository.save(user);

        redisService.deleteToken("refresh_token", previousUsername);

        long accessExpiryMinutes = 15;
        long refreshExpiryMinutes = 60 * 24 * 7;

        String newAccessToken = jwtService.generateToken(newUsername, accessExpiryMinutes, "access_token");
        String newRefreshToken = jwtService.generateToken(newUsername, refreshExpiryMinutes, "refresh_token");

        redisService.setToken("refresh_token", newUsername, newRefreshToken, refreshExpiryMinutes * 60); // in seconds

        cookieUtil.addCookie(httpResponse, "access_token", newAccessToken, (int) (accessExpiryMinutes * 60));

        cookieUtil.addCookie(httpResponse, "username", newUsername, (int) (refreshExpiryMinutes * 60));

        redisService.set("username_update:" + userId, newUsername, 60, TimeUnit.MINUTES);

        Map<String, String> response = new HashMap<>();
        response.put("previousUsername", previousUsername);
        response.put("newUsername", newUsername);
        response.put("message", "Username changed successfully. Access token rotated.");

        return ResponseEntity.ok(response);
    }

    @Transactional
    public ResponseEntity<?> getFollowData(String username, int offset, int limit, String type) {
        Optional<userModel> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found!"));
        }

        Pageable pageable = PageRequest.of(offset / limit, limit, Sort.by(Sort.Direction.DESC, "followDate"));
        Page<FollowersModel> followPage;

        userModel user = userOpt.get();
        String userId = user.getUserId();

        boolean isFollowers = type.equalsIgnoreCase("followers");
        if (isFollowers) {
            followPage = followersRepository.findByFollowedUserId(userId, pageable);
        } else if (type.equalsIgnoreCase("following")) {
            followPage = followersRepository.findByFollowerUserId(userId, pageable);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid type. Use 'followers' or 'following'."));
        }

        List<String> userIds = followPage.getContent().stream()
                .map(isFollowers ? FollowersModel::getFollowerUserId : FollowersModel::getFollowedUserId)
                .collect(Collectors.toList());

        List<UserSummary> result = userIds.isEmpty()
                ? List.of()
                : userRepository.findUserSummariesByUserIdIn(userIds);

        Map<String, Object> response = new HashMap<>();
        response.put(type, result);
        response.put(type + "Count", followPage.getTotalElements());
        response.put("offset", offset);
        response.put("limit", limit);

        return ResponseEntity.ok(response);
    }

    @Transactional
    public ResponseEntity<?> followUserByUsername(String followerUsername, String targetUsername,
            Map<String, Boolean> requestBody) {
        log.info("🔁 Follow request: follower='{}', target='{}', requestBody={}",
                followerUsername, targetUsername, requestBody);

        boolean isFollowing = requestBody.getOrDefault("isFollowing", false);
        Optional<userModel> followerOpt = userRepository.findByUsername(followerUsername);
        Optional<userModel> targetOpt = userRepository.findByUsername(targetUsername);

        if (followerOpt.isEmpty() || targetOpt.isEmpty()) {
            log.warn("❌ User not found: follower='{}' exists={}, target='{}' exists={}",
                    followerUsername, followerOpt.isPresent(), targetUsername, targetOpt.isPresent());
            return ResponseEntity.status(404).body("User not found.");
        }

        userModel follower = followerOpt.get();
        userModel target = targetOpt.get();

        if (isFollowing) {
            return handleUnfollow(follower, target);
        } else {
            return handleFollow(follower, target);
        }
    }

    private ResponseEntity<?> handleFollow(userModel follower, userModel target) {
        if (follower.getUserId().equals(target.getUserId())) {
            return ResponseEntity.badRequest().body("❌ You can't follow yourself.");
        }

        boolean alreadyFollowing = followersRepository.existsByFollowerUserIdAndFollowedUserId(
                follower.getUserId(), target.getUserId());

        if (alreadyFollowing) {
            log.warn("⚠️ '{}' already follows '{}'", follower.getUsername(), target.getUsername());
            return ResponseEntity.status(409).body("Already following.");
        }

        FollowersModel relation = new FollowersModel(
                null,
                follower.getUserId(),
                target.getUserId(),
                new Date());

        followerBatchBuffer.bufferFollow(relation);

        NotificationModel notification = new NotificationModel();
        notification.setSenderUsername(follower.getUsername());
        notification.setReceiverUsername(target.getUsername());
        notification.setProfilePictureUrl(follower.getProfilePictureUrl());
        notification.setMemeId(null);
        notification.setType("FOLLOW");
        notification.setMessage(follower.getUsername() + " started following you");
        notification.setRead(false);
        notification.setCreatedAt(new Date());

        notificationBatchBuffer.buffer(notification);

        log.info("✅ Buffered Follow: {} ➡ {}", follower.getUsername(), target.getUsername());
        return ResponseEntity.ok("Followed successfully.");
    }

    private ResponseEntity<?> handleUnfollow(userModel follower, userModel target) {
        if (follower.getUserId().equals(target.getUserId())) {
            return ResponseEntity.badRequest().body("❌ You can't unfollow yourself.");
        }

        boolean alreadyFollowing = followersRepository.existsByFollowerUserIdAndFollowedUserId(
                follower.getUserId(), target.getUserId());

        if (!alreadyFollowing) {
            log.warn("⚠️ '{}' is not following '{}'", follower.getUsername(), target.getUsername());
            return ResponseEntity.status(400).body("Not following.");
        }

        FollowersModel relation = new FollowersModel(
                null,
                follower.getUserId(),
                target.getUserId(),
                new Date());

        followerBatchBuffer.bufferUnfollow(relation);

        log.info("✅ Buffered Unfollow: {} ⬅ {}", follower.getUsername(), target.getUsername());
        return ResponseEntity.ok("Unfollowed successfully.");
    }

    public ResponseEntity<?> getUserProfileMemes(String username, int offset, int limit, String typeString) {
        Optional<userModel> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
        }

        userModel user = userOpt.get();
        String userId = user.getUserId();
        ActionType type;

        try {
            type = ActionType.valueOf(typeString.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid type. Supported types: LIKE, SAVE, UPLOAD.");
        }

        int page = offset / limit;
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "timestamp"));
        Slice<MemeIdDBO> memeIdSlice = userInteractionRepository.findMemeIdsByUserIdAndType(userId, type, pageable);
        boolean hasNext = memeIdSlice.hasNext();

        List<String> orderedMemeIds = memeIdSlice.getContent().stream()
                .map(MemeIdDBO::getMemeId)
                .filter(ObjectId::isValid)
                .collect(Collectors.toList());

        if (orderedMemeIds.isEmpty()) {
            return ResponseEntity.ok(new MemeFeedResponse(Collections.emptyList(), hasNext));
        }

        Set<ObjectId> targetMemeIds = orderedMemeIds.stream()
                .map(ObjectId::new)
                .collect(Collectors.toSet());

        List<Meme> unsortedMemes = memeRepository.findByIdIn(targetMemeIds);

        Map<String, Meme> memeMap = unsortedMemes.stream()
                .collect(Collectors.toMap(Meme::getId, m -> m));

        List<Meme> sortedMemes = orderedMemeIds.stream()
                .map(memeMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Slice<UserInteraction> interactionsSlice = userInteractionRepository.findByUserIdAndMemeIdInAndTypeIn(
                userId,
                targetMemeIds.stream().map(ObjectId::toHexString).collect(Collectors.toSet()),
                List.of(ActionType.LIKE, ActionType.SAVE),
                PageRequest.of(0, targetMemeIds.size()));

        List<UserInteraction> interactions = interactionsSlice.getContent();

        Map<String, Set<ActionType>> interactionMap = new HashMap<>();
        for (UserInteraction interaction : interactions) {
            interactionMap
                    .computeIfAbsent(interaction.getMemeId(), k -> new HashSet<>())
                    .add(interaction.getType());
        }

        List<MemeDto> memeDtos = sortedMemes.stream().map(meme -> {
            Set<ActionType> actions = interactionMap.getOrDefault(meme.getId(), Set.of());
            boolean liked = actions.contains(ActionType.LIKE);
            boolean saved = actions.contains(ActionType.SAVE);
            return new MemeDto(meme, liked, saved);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(new MemeFeedResponse(memeDtos, hasNext));
    }

}