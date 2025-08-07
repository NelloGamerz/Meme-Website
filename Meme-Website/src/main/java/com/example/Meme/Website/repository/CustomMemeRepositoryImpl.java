package com.example.Meme.Website.repository;

import java.util.*;
import java.util.stream.Collectors;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import com.example.Meme.Website.models.FollowersModel;
import com.example.Meme.Website.models.Meme;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class CustomMemeRepositoryImpl implements CustomMemeRepository {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private followersRepository followerwRepository;

    @Override
    public List<Meme> findRelatedMemes(String memeId, String userId, int limit, int page) {
        Meme currentMeme = mongoTemplate.findById(memeId, Meme.class);
        if (currentMeme == null) {
            log.warn("❌ Meme with ID '{}' not found", memeId);
            return List.of();
        }

        Set<String> addedIds = new HashSet<>();
        List<Meme> allCandidates = new ArrayList<>();

        // 1. Same uploader
        Query uploaderQuery = new Query()
                .addCriteria(Criteria.where("_id").ne(new ObjectId(memeId))
                        .and("userId").is(currentMeme.getUserId()))
                .with(Sort.by(Sort.Direction.DESC, "likecount", "memeCreated"));
        for (Meme meme : mongoTemplate.find(uploaderQuery, Meme.class)) {
            if (addedIds.add(meme.getId())) {
                allCandidates.add(meme);
            }
        }

        // 2. From following users
        Pageable pageable = PageRequest.of(0, 20);
        List<String> followingUserIds = followerwRepository.findByFollowerUserId(userId, pageable).stream()
                .map(FollowersModel::getFollowedUserId)
                .collect(Collectors.toList());

        if (!followingUserIds.isEmpty()) {
            Query followingQuery = new Query()
                    .addCriteria(Criteria.where("_id").ne(new ObjectId(memeId))
                            .and("userId").in(followingUserIds))
                    .with(Sort.by(Sort.Direction.DESC, "likecount", "saveCount", "commentsCount", "views"))
                    .limit(5);
            for (Meme meme : mongoTemplate.find(followingQuery, Meme.class)) {
                if (addedIds.add(meme.getId())) {
                    allCandidates.add(meme);
                }
            }
        }

        // 3. By tags (most relevant)
        List<String> tags = currentMeme.getTags();
        if (tags != null && !tags.isEmpty()) {
            MatchOperation matchTags = Aggregation.match(
                    Criteria.where("_id").ne(new ObjectId(memeId)).and("tags").in(tags));

            AggregationExpression tagMatchScoreExpr = context -> new Document("$size",
                    new Document("$setIntersection", List.of("$tags", tags)));

            AggregationExpression engagementScoreExpr = context -> new Document("$add", List.of(
                    new Document("$multiply", List.of("$likecount", 2)),
                    new Document("$multiply", List.of("$commentsCount", 1.5)),
                    new Document("$multiply", List.of("$saveCount", 1)),
                    new Document("$multiply", List.of("$viewCount", 0.5))
            ));

            ProjectionOperation project = Aggregation.project(
                    "id", "userId", "mediaUrl", "mediaType", "caption", "uploader",
                    "likecount", "commentsCount", "tags", "profilePictureUrl", "views", "saveCount", "memeCreated")
                    .and(tagMatchScoreExpr).as("tagMatchScore")
                    .and(engagementScoreExpr).as("engagementScore");

            Aggregation aggregation = Aggregation.newAggregation(
                    matchTags,
                    project,
                    Aggregation.sort(Sort.by(Sort.Direction.DESC, "tagMatchScore", "engagementScore")),
                    Aggregation.limit(30)
            );

            AggregationResults<Document> tagResults = mongoTemplate.aggregate(aggregation, "memes", Document.class);
            for (Document doc : tagResults.getMappedResults()) {
                Meme meme = mapToMeme(doc);
                if (addedIds.add(meme.getId())) {
                    allCandidates.add(meme);
                }
            }
        }

        // 4. Trending memes fallback
        Query trendingQuery = new Query()
                .addCriteria(Criteria.where("_id").ne(new ObjectId(memeId)))
                .with(Sort.by(Sort.Direction.DESC, "likecount", "memeCreated"))
                .limit(50);
        for (Meme meme : mongoTemplate.find(trendingQuery, Meme.class)) {
            if (addedIds.add(meme.getId())) {
                allCandidates.add(meme);
            }
        }

        // 5. Final pagination & filter
        List<Meme> paginatedResults = allCandidates.stream()
                .filter(m -> m.getId() != null && !m.getId().equals(memeId))
                .skip((long) (page - 1) * limit)
                .limit(limit)
                .collect(Collectors.toList());

        log.info("🔁 Returning {} related memes (page {}) for memeId='{}'", paginatedResults.size(), page, memeId);
        return paginatedResults;
    }

    private Meme mapToMeme(Document doc) {
        Meme meme = new Meme();
        ObjectId id = doc.getObjectId("_id");
        if (id != null) {
            meme.setId(id.toHexString());
        }
        meme.setMediaUrl(doc.getString("mediaUrl"));
        meme.setCaption(doc.getString("caption"));
        meme.setUploader(doc.getString("uploader"));
        meme.setProfilePictureUrl(doc.getString("profilePictureUrl"));
        meme.setUserId(doc.getString("userId"));
        meme.setCommentsCount(doc.getInteger("commentsCount", 0));
        meme.setMediaType(doc.getString("mediaType"));
        meme.setLikecount(doc.getInteger("likecount", 0));
        meme.setSaveCount(doc.getInteger("saveCount", 0));
        meme.setViewCount(doc.getInteger("views", 0));
        meme.setMemeCreated(doc.getDate("memeCreated"));

        Object tagsObj = doc.get("tags");
        if (tagsObj instanceof List<?>) {
            List<String> tagsList = ((List<?>) tagsObj).stream()
                    .filter(tag -> tag instanceof String)
                    .map(String.class::cast)
                    .collect(Collectors.toList());
            meme.setTags(tagsList);
        }

        return meme;
    }
}
