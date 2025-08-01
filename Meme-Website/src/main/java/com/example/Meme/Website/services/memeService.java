package com.example.Meme.Website.services;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.example.Meme.Website.DBO.MemeInteractionDBO;
import com.example.Meme.Website.WebSockets.WebSocketSessionManager;
import com.example.Meme.Website.batch.CommentBatchBuffer;
import com.example.Meme.Website.batch.InteractionBatchBuffer;
import com.example.Meme.Website.batch.MemeBatchBuffer;
import com.example.Meme.Website.batch.NotificationBatchBuffer;
import com.example.Meme.Website.dto.MemeDto;
import com.example.Meme.Website.dto.MemeFeedResponse;
import com.example.Meme.Website.dto.ScoreMeme;
import com.example.Meme.Website.dto.SearchResult;
import com.example.Meme.Website.dto.UserSearchDto;
import com.example.Meme.Website.models.ActionType;
import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.models.FollowersModel;
import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.models.NotificationModel;
import com.example.Meme.Website.models.UserInteraction;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.CustomMemeRepository;
import com.example.Meme.Website.repository.commentRepository;
import com.example.Meme.Website.repository.followersRepository;
import com.example.Meme.Website.repository.memeRepository;
import com.example.Meme.Website.repository.userInteractionsRepository;
import com.example.Meme.Website.repository.userRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class memeService {

    @Autowired
    private userRepository userRepository;
    @Autowired
    private memeRepository memeRepository;
    @Autowired
    private commentRepository commentRepository;
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private RedisService redisService;
    @Autowired
    private CustomMemeRepository customMemeRepository;
    @Autowired
    private TrendingCacheService trendingCacheService;
    @Autowired
    private followersRepository followersRepository;
    @Autowired
    private userInteractionsRepository userInteractionRepository;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private InteractionBatchBuffer buffer;
    @Autowired
    private MemeBatchBuffer memeBuffer;
    @Autowired
    private NotificationBatchBuffer notificationBatchBuffer;
    @Autowired
    private CommentBatchBuffer commentBatchBuffer;

    private final Map<String, Double> scoreCache = new HashMap<>();

    public MemeDto getMemeById(String memeId, String userId, boolean excludeComments) {
        Optional<Meme> optionalMeme = memeRepository.findById(memeId);
        if (optionalMeme.isEmpty()) {
            return null;
        }

        Meme meme = optionalMeme.get();

        boolean liked = false;
        boolean saved = false;

        if (userId != null) {
            List<MemeInteractionDBO> interactions = userInteractionRepository
                    .findUserInteractionMemeIdsByType(
                            userId,
                            Set.of(memeId),
                            List.of(ActionType.LIKE, ActionType.SAVE),
                            PageRequest.of(0, 2))
                    .getContent();

            for (MemeInteractionDBO interaction : interactions) {
                if (interaction.getType() == ActionType.LIKE)
                    liked = true;
                if (interaction.getType() == ActionType.SAVE)
                    saved = true;
            }
        }

        return new MemeDto(meme, liked, saved);
    }

    @Transactional
    public ResponseEntity<?> getMemeComments(String memeId, int page, int limit) {
        PageRequest pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Comments> commentPage = commentRepository.findByMemeId(memeId, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("data", commentPage.getContent());
        response.put("currentPage", commentPage.getNumber() + 1);
        response.put("totalPages", commentPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @Transactional
    public ResponseEntity<?> likedMemes(String username, String memeId, boolean like) {
        Optional<userModel> optionalUser = userRepository.findByUsername(username);
        Optional<Meme> optionalMeme = memeRepository.findById(memeId);

        if (optionalUser.isEmpty() || optionalMeme.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User or meme not found");
        }

        userModel user = optionalUser.get();
        Meme meme = optionalMeme.get();

        boolean alreadyLiked = userInteractionRepository.existsByUserIdAndMemeIdAndType(
                user.getUserId(), memeId, ActionType.LIKE);
        String message;

        UserInteraction interaction = new UserInteraction(
                null,
                user.getUserId(),
                memeId,
                ActionType.LIKE,
                new Date());

        if (like) {
            if (!alreadyLiked) {
                buffer.bufferInsert(interaction);
                message = "Meme liked successfully";

                if (!user.getUsername().equals(meme.getUploader())) {
                    NotificationModel notification = new NotificationModel();
                    notification.setSenderUsername(user.getUsername());
                    notification.setReceiverUsername(meme.getUploader());
                    notification.setProfilePictureUrl(user.getProfilePictureUrl());
                    notification.setMemeId(memeId);
                    notification.setType("LIKE");
                    notification.setMessage(user.getUsername() + " liked your meme");
                    notification.setRead(false);
                    notification.setCreatedAt(new Date());

                    notificationBatchBuffer.buffer(notification);
                }

            } else {
                message = "Meme already liked";
            }
        } else {
            if (alreadyLiked) {
                buffer.bufferDelete(interaction);
                message = "Meme unliked successfully";
            } else {
                message = "Meme was not previously liked";
            }
        }

        ObjectNode response = new ObjectMapper().createObjectNode();
        response.put("message", message);
        response.put("likeCount", meme.getLikecount());

        return ResponseEntity.ok(response);
    }

    @Transactional
    public ResponseEntity<?> saveMeme(String username, String memeId, boolean save) {
        Optional<userModel> optionalUser = userRepository.findByUsername(username);
        Optional<Meme> optionalMeme = memeRepository.findById(memeId);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(404).body("User or meme not found");
        }

        userModel user = optionalUser.get();
        Meme meme = optionalMeme.get();

        boolean alreadySaved = userInteractionRepository.existsByUserIdAndMemeIdAndType(
                user.getUserId(), memeId, ActionType.SAVE);

        String message;

        UserInteraction interaction = new UserInteraction(
                null,
                user.getUserId(),
                memeId,
                ActionType.SAVE,
                new Date());

        if (save) {
            if (!alreadySaved) {
                buffer.bufferInsert(interaction);
                message = "Meme saved successfully";

                if (!user.getUsername().equals(meme.getUploader())) {
                    NotificationModel notification = new NotificationModel();
                    notification.setSenderUsername(user.getUsername());
                    notification.setReceiverUsername(meme.getUploader());
                    notification.setProfilePictureUrl(user.getProfilePictureUrl());
                    notification.setMemeId(memeId);
                    notification.setType("SAVE");
                    notification.setMessage(user.getUsername() + " saved your meme");
                    notification.setRead(false);
                    notification.setCreatedAt(new Date());

                    notificationBatchBuffer.buffer(notification);
                }
            } else {
                message = "Meme already saved";
            }
        } else {
            if (alreadySaved) {
                buffer.bufferDelete(interaction);
                message = "Meme unsaved successfully";
            } else {
                message = "Meme was not previously saved";
            }
        }

        ObjectNode response = new ObjectMapper().createObjectNode();
        response.put("message", message);
        response.put("saveCount", meme.getSaveCount());

        return ResponseEntity.ok(response);
    }

    @Transactional
    public Comments addCommentsToMeme(Comments comment) throws IOException {
        Optional<Meme> optionalMeme = memeRepository.findById(comment.getMemeId());
        if (optionalMeme.isEmpty()) {
            throw new RuntimeException("Meme not found");
        }

        Meme meme = optionalMeme.get();

        commentBatchBuffer.bufferComment(comment);

        if (!comment.getUsername().equals(meme.getUploader())) {
            NotificationModel notification = new NotificationModel(
                    null,
                    comment.getUsername(),
                    meme.getUploader(),
                    comment.getProfilePictureUrl(),
                    "COMMENT",
                    comment.getUsername() + " commented on your meme: " + meme.getCaption(),
                    false,
                    meme.getId(),
                    new Date(),
                    null);

            notificationBatchBuffer.buffer(notification);
        }

        ObjectNode messageNode = objectMapper.valueToTree(comment);
        messageNode.put("type", "COMMENT");
        String payload = objectMapper.writeValueAsString(messageNode);
        TextMessage message = new TextMessage(payload);

        WebSocketSession commentorSession = WebSocketSessionManager.getSession(comment.getUserId());
        if (commentorSession != null && commentorSession.isOpen()) {
            commentorSession.sendMessage(message);
        }

        return comment;
    }

    @Transactional
    public Map<String, Object> getUserMemes(String username, String userId, ActionType type, int page, int limit) {

        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "timestamp"));

        Slice<UserInteraction> actionSlice = userInteractionRepository.findByUserIdAndType(userId, type,
                pageable);
        List<String> memeIds = actionSlice.getContent().stream()
                .map(doc -> doc.getMemeId())
                .collect(Collectors.toList());

        List<Meme> memes = memeRepository.findAllById(memeIds);

        Map<String, Object> response = new HashMap<>();
        response.put("memes", memes);
        response.put("hasNext", actionSlice.hasNext());
        response.put("currentPage", page);

        return response;
    }

    @Transactional
    public ResponseEntity<SearchResult> searchMemes(String query, String startDate, String endDate, int limit, int page,
            String sort, boolean excludeComments) {
        PageRequest.of(page, limit,
                Sort.by(sort.equals("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, "createdAt"));

        String regexQuery = (query != null && !query.isEmpty()) ? ".*" + query + ".*" : ".*";

        List<Meme> memes = memeRepository.findByCaptionRegexExcludeComments(regexQuery);
        List<UserSearchDto> users = userRepository.findUsersByUsernameRegex(regexQuery);

        SearchResult result = new SearchResult(users, memes);
        return ResponseEntity.ok(result);
    }

    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> deleteMeme(String memeId) throws Exception {
        Optional<Meme> memeOptional = memeRepository.findById(memeId);
        if (memeOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Meme not found"));
        }

        Meme meme = memeOptional.get();

        try {
            memeBuffer.bufferMemeDelete(meme);
            redisService.pushMemeToCleanupQueue(memeId);
            updateRedisCache(memeId);

            return ResponseEntity.ok(Map.of("message", "Meme deleted. Cleanup scheduled."));
        } catch (Exception e) {
            log.error("❌ Error while deleting meme '{}': {}", memeId, e.getMessage());
            throw e;
        }
    }

    private void updateRedisCache(String memeId) {
        String redisKey = "AllMemes";
        List<Meme> cachedMemes = redisService.getList(redisKey, Meme.class);

        if (cachedMemes != null && cachedMemes.removeIf(m -> m.getId().equals(memeId))) {
            redisService.set(redisKey, cachedMemes, 10, TimeUnit.MINUTES);
            log.info("🧠 Redis cache updated for meme deletion");
        }
    }

    public List<Meme> getRecomendedMemes(String memeId, String userId, int page, int limit) {
        return customMemeRepository.findRelatedMemes(memeId, userId, limit, page);
    }

    public MemeFeedResponse discoverMemes(String username, int page, int limit) {
        Optional<userModel> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return new MemeFeedResponse(Collections.emptyList(), false);
        }

        userModel user = optionalUser.get();
        String userId = user.getUserId();

        String redisKey = "explore_seen:" + userId;

        if (page == 0) {
            redisService.deleteKey(redisKey);
        }

        Set<String> seenIds = new HashSet<>(redisService.getList(redisKey, String.class));

        List<Meme> trendingMemes = trendingCacheService.getTrendingMemes();

        Map<String, Integer> tagScores = user.getTagInteractions();
        List<Meme> interestMemes = new ArrayList<>();
        if (tagScores != null && !tagScores.isEmpty()) {
            List<String> topTags = tagScores.entrySet().stream()
                    .sorted((a, b) -> b.getValue() - a.getValue())
                    .limit(5)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());

            interestMemes = memeRepository.findByTagsIn(topTags);
        }

        List<String> followingIds = followersRepository.findFollowingIdsByFollowerId(userId);
        List<Meme> followingMemes = followingIds.isEmpty()
                ? new ArrayList<>()
                : memeRepository.findByUploaderIn(followingIds);

        Set<String> added = new HashSet<>();
        List<Meme> candidates = new ArrayList<>();

        Stream.of(interestMemes, followingMemes)
                .flatMap(Collection::stream)
                .filter(meme -> !seenIds.contains(meme.getId()) && added.add(meme.getId()))
                .forEach(candidates::add);

        Stream.of(trendingMemes)
                .flatMap(Collection::stream)
                .filter(meme -> added.add(meme.getId()))
                .forEach(candidates::add);

        if (candidates.size() < limit) {
            List<Meme> global = memeRepository.findGlobalMemes();
            for (Meme meme : global) {
                if (!added.contains(meme.getId()) && !seenIds.contains(meme.getId())) {
                    candidates.add(meme);
                    added.add(meme.getId());
                }
                if (candidates.size() >= 200)
                    break;
            }
        }

        LocalDateTime recentThreshold = LocalDateTime.now().minusMinutes(30);
        Set<String> trendingIds = trendingMemes.stream()
                .map(Meme::getId)
                .collect(Collectors.toSet());

        Set<String> interestIds = interestMemes.stream()
                .map(Meme::getId)
                .collect(Collectors.toSet());

        Set<String> followingIdsSet = new HashSet<>(followingIds);

        List<Pair<Meme, Integer>> scored = candidates.stream()
                .map(meme -> {
                    int score = 0;

                    if (tagScores != null) {
                        for (String tag : meme.getTags()) {
                            score += tagScores.getOrDefault(tag, 0);
                        }
                    }

                    if (interestIds.contains(meme.getId()))
                        score += 15;
                    if (followingIdsSet.contains(meme.getUploader()))
                        score += 10;
                    if (trendingIds.contains(meme.getId()))
                        score += 5;

                    LocalDateTime created = meme.getMemeCreated().toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime();
                    if (created.isAfter(recentThreshold))
                        score += 3;

                    return Pair.of(meme, score);
                })
                .sorted((a, b) -> b.getRight() - a.getRight())
                .collect(Collectors.toList());

        int start = page * limit;
        int end = Math.min(start + limit, scored.size());
        boolean hasNext = end < scored.size();
        if (start >= scored.size()) {
            return new MemeFeedResponse(Collections.emptyList(), false);
        }

        List<Meme> pageMemes = scored.subList(start, end).stream()
                .map(Pair::getLeft)
                .collect(Collectors.toList());

        List<String> newSeen = pageMemes.stream()
                .map(Meme::getId)
                .collect(Collectors.toList());
        seenIds.addAll(newSeen);
        redisService.set(redisKey, new ArrayList<>(seenIds), 1, TimeUnit.MINUTES);

        Pageable pageable = PageRequest.of(0, limit);
        Slice<MemeInteractionDBO> interactionsSlice = userInteractionRepository
                .findUserInteractionMemeIdsByType(userId, new HashSet<>(newSeen),
                        List.of(ActionType.LIKE, ActionType.SAVE), pageable);

        Map<String, Set<ActionType>> interactionMap = new HashMap<>();
        for (MemeInteractionDBO interaction : interactionsSlice) {
            interactionMap
                    .computeIfAbsent(interaction.getMemeId(), k -> new HashSet<>())
                    .add(interaction.getType());
        }

        List<MemeDto> memeDtos = pageMemes.stream()
                .map(meme -> {
                    Set<ActionType> actions = interactionMap.getOrDefault(meme.getId(), Set.of());
                    boolean liked = actions.contains(ActionType.LIKE);
                    boolean saved = actions.contains(ActionType.SAVE);
                    return new MemeDto(meme, liked, saved);
                })
                .collect(Collectors.toList());

        return new MemeFeedResponse(memeDtos, hasNext);
    }

    public List<Meme> findRelatedMemes(String memeId, String userId, double lastScore, String lastId, int limit) {
        Meme currentMeme = mongoTemplate.findById(memeId, Meme.class);
        if (currentMeme == null)
            return List.of();

        Set<String> intracted = getUserInteractedMemeIds(userId);
        List<Meme> candidates = buildCandidatesStream(currentMeme, userId,
                intracted);

        List<ScoreMeme> scored = scoreAndRank(candidates, currentMeme, userId);
        List<ScoreMeme> diversified = diversify(scored);
        List<ScoreMeme> paginated = paginateByCursor(diversified, lastScore, lastId,
                limit);

        return paginated.stream().map(sm -> sm.getMeme()).toList();
    }

    private List<ScoreMeme> diversify(List<ScoreMeme> memes) {
        Map<String, Integer> uploaderLimit = new HashMap<>();
        Set<String> usedTags = new HashSet<>();
        List<ScoreMeme> diversified = new ArrayList<>();

        for (ScoreMeme scored : memes) {
            Meme meme = scored.getMeme();
            String uploaderId = meme.getUserId();
            List<String> tags = meme.getTags();

            if (uploaderLimit.getOrDefault(uploaderId, 0) >= 2)
                continue;

            if (tags != null && tags.stream().anyMatch(usedTags::contains))
                continue;

            diversified.add(scored);
            uploaderLimit.put(uploaderId, uploaderLimit.getOrDefault(uploaderId, 0) + 1);
            if (tags != null)
                usedTags.addAll(tags);

            if (diversified.size() >= 100)
                break;
        }

        return diversified;
    }

    private List<ScoreMeme> paginateByCursor(List<ScoreMeme> memes, double lastScore, String lastId, int limit) {
        return memes.stream()
                .filter(sm -> {
                    double score = sm.getScore();
                    String id = sm.getMeme().getId();
                    return score < lastScore || (score == lastScore && id.compareTo(lastId) < 0);
                })
                .sorted(Comparator.comparingDouble(ScoreMeme::getScore).reversed()
                        .thenComparing(sm -> sm.getMeme().getId(), Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private List<Meme> buildCandidatesStream(Meme current, String userId,
            Set<String> excludeIds) {
        List<Meme> result = new ArrayList<>();
        Set<String> added = new HashSet<>(excludeIds);

        result.addAll(queryUploaderMemes(current, added));
        result.addAll(queryFollowedUserMemes(userId, added));
        result.addAll(querySimilarTagMemes(current, added));
        result.addAll(queryTrendingMemes(added));
        result.addAll(queryExploreMemes(added));

        return result;
    }

    private List<Meme> queryUploaderMemes(Meme current, Set<String> exclude) {
        Query query = new Query()
                .addCriteria(Criteria.where("userId").is(current.getUserId()).and("_id").ne(current.getId()))
                .with(Sort.by(Sort.Direction.DESC, "memeCreated"))
                .limit(20);
        return mongoTemplate.find(query, Meme.class).stream()
                .filter(m -> exclude.add(m.getId()))
                .toList();
    }

    private List<Meme> queryFollowedUserMemes(String userId, Set<String> exclude) {
        Pageable pageable = PageRequest.of(0, 20);
        List<String> followed = followersRepository.findByFollowerUserId(userId, pageable)
                .stream().map(FollowersModel::getFollowedUserId).toList();

        if (followed.isEmpty())
            return List.of();

        Query query = new Query()
                .addCriteria(Criteria.where("userId").in(followed))
                .with(Sort.by(Sort.Order.desc("likecount"), Sort.Order.desc("saveCount")))
                .limit(20);

        return mongoTemplate.find(query, Meme.class).stream()
                .filter(m -> exclude.add(m.getId()))
                .toList();
    }

    private List<Meme> querySimilarTagMemes(Meme current, Set<String> exclude) {
        List<String> tags = current.getTags();
        if (tags == null || tags.isEmpty())
            return List.of();

        Query query = new Query()
                .addCriteria(Criteria.where("tags").in(tags).and("_id").ne(current.getId()))
                .with(Sort.by(Sort.Direction.DESC, "memeCreated"))
                .limit(30);

        return mongoTemplate.find(query, Meme.class).stream()
                .filter(m -> exclude.add(m.getId()))
                .toList();
    }

    private List<Meme> queryTrendingMemes(Set<String> exclude) {
        Query query = new Query()
                .addCriteria(Criteria.where("likecount").gt(10))
                .with(Sort.by(Sort.Direction.DESC, "likecount", "views"))
                .limit(30);

        return mongoTemplate.find(query, Meme.class).stream()
                .filter(m -> exclude.add(m.getId()))
                .toList();
    }

    private List<Meme> queryExploreMemes(Set<String> exclude) {
        Query query = new Query()
                .addCriteria(Criteria.where("_id").nin(exclude))
                .with(Sort.by(Sort.Direction.DESC, "memeCreated"))
                .limit(20);
        return mongoTemplate.find(query, Meme.class).stream()
                .filter(m -> exclude.add(m.getId()))
                .toList();
    }

    private List<ScoreMeme> scoreAndRank(List<Meme> memes, Meme current, String userId) {
        return memes.stream().map(m -> {
            double tagScore = computeTagOverlap(current, m);
            double freshness = computeFreshnessScore(m);
            double engagement = computeEngagementScore(m);
            double socialBoost = computeUserAffinityBoost(userId, m);
            double score = tagScore * 1.5 + engagement * 2.0 + freshness + socialBoost;

            scoreCache.put(m.getId(), score);
            return new ScoreMeme(m, score);
        }).sorted(Comparator.comparingDouble(ScoreMeme::getScore).reversed()
                .thenComparing(sm -> sm.getMeme().getId(), Comparator.reverseOrder()))
                .toList();
    }

    public double getScoreOfMeme(String memeId) {
        return scoreCache.getOrDefault(memeId, 0.0);
    }

    private double computeTagOverlap(Meme a, Meme b) {
        if (a.getTags() == null || b.getTags() == null)
            return 0;
        Set<String> setA = new HashSet<>(a.getTags());
        Set<String> setB = new HashSet<>(b.getTags());
        setA.retainAll(setB);
        return setA.size();
    }

    private double computeEngagementScore(Meme meme) {
        return meme.getLikecount() * 2 + meme.getCommentsCount() * 1.5 +
                meme.getSaveCount()
                + meme.getViewCount() * 0.5;
    }

    private double computeFreshnessScore(Meme meme) {
        Date createdDate = meme.getMemeCreated();
        if (createdDate == null) {
            return 0;
        }

        long ageInHours = (System.currentTimeMillis() - createdDate.getTime()) / 3600000;
        return Math.max(0, 100 - ageInHours);
    }

    private double computeUserAffinityBoost(String userId, Meme meme) {
        return 0.0;
    }

    private Set<String> getUserInteractedMemeIds(String userId) {
        return new HashSet<>();
    }

    public MemeFeedResponse buildMainFeed(String userId, int page, int limit) {
        String redisKey = "sent_memes:" + userId;

        if (page == 1) {
            redisService.deleteKey(redisKey);
        }

        List<String> alreadySentMemeIds = redisService.getList(redisKey, String.class);
        Set<String> sentIds = new HashSet<>(alreadySentMemeIds);

        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);

        List<Meme> freshMemes = memeRepository
                .findByMemeCreatedAfterAndIdNotInOrderByMemeCreatedDesc(oneMinuteAgo, sentIds);
        Set<String> newSentIds = freshMemes.stream()
                .map(Meme::getId)
                .collect(Collectors.toSet());

        sentIds.addAll(newSentIds);

        List<Meme> oldMemes = memeRepository
                .findByMemeCreatedBeforeAndIdNotIn(oneMinuteAgo, sentIds);
        if (page == 1) {
            Collections.shuffle(oldMemes);
        }

        List<Meme> combined = new ArrayList<>();
        if (page == 1) {
            combined.addAll(freshMemes);
        }
        combined.addAll(oldMemes);

        int start = 0;
        int end = Math.min(limit, combined.size());
        List<Meme> pageResult = combined.subList(start, end);
        boolean hasNext = combined.size() > limit;

        Set<String> resultIds = pageResult.stream().map(Meme::getId).collect(Collectors.toSet());
        alreadySentMemeIds.addAll(resultIds);
        redisService.set(redisKey, alreadySentMemeIds, 1, TimeUnit.HOURS);

        Pageable pageable = PageRequest.of(0, limit);

        Slice<MemeInteractionDBO> likedOrSavedMemeIdsSlice = userInteractionRepository
                .findUserInteractionMemeIdsByType(
                        userId,
                        resultIds,
                        List.of(ActionType.LIKE, ActionType.SAVE),
                        pageable);

        List<MemeInteractionDBO> interactions = likedOrSavedMemeIdsSlice.getContent();

        Map<String, Set<ActionType>> interactionMap = new HashMap<>();
        for (MemeInteractionDBO interaction : interactions) {
            interactionMap
                    .computeIfAbsent(interaction.getMemeId(), k -> new HashSet<>())
                    .add(interaction.getType());
        }

        List<MemeDto> memeDtos = pageResult.stream().map(meme -> {
            Set<ActionType> actions = interactionMap.getOrDefault(meme.getId(), Set.of());
            boolean liked = actions.contains(ActionType.LIKE);
            boolean saved = actions.contains(ActionType.SAVE);
            return new MemeDto(meme, liked, saved);
        }).collect(Collectors.toList());

        return new MemeFeedResponse(memeDtos, hasNext);

    }

}
