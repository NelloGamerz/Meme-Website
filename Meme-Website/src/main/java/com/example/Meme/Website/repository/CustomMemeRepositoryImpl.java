package com.example.Meme.Website.repository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationExpression;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.aggregation.ProjectionOperation;
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

        Query uploaderQuery = new Query()
                .addCriteria(Criteria.where("_id").ne(memeId)
                        .and("userId").is(currentMeme.getUserId()))
                .with(Sort.by(Sort.Direction.DESC, "likecount", "memeCreated"));
        for (Meme meme : mongoTemplate.find(uploaderQuery, Meme.class)) {
            if (addedIds.add(meme.getId())) {
                allCandidates.add(meme);
            }
        }

        Pageable pageable = PageRequest.of(0,20);
        List<String> followingUserIds = followerwRepository.findByFollowerUserId(userId, pageable).stream()
                .map(FollowersModel::getFollowedUserId)
                .collect(Collectors.toList());

        if (!followingUserIds.isEmpty()) {
            Query followingQuery = new Query()
                    .addCriteria(Criteria.where("_id").ne(memeId)
                            .and("userId").in(followingUserIds))
                    .with(Sort.by(Sort.Direction.DESC, "likecount", "saveCount", "commentsCount", "views"))
                    .limit(5);
            for (Meme meme : mongoTemplate.find(followingQuery, Meme.class)) {
                if (addedIds.add(meme.getId())) {
                    allCandidates.add(meme);
                    break;
                }
            }
        }

        List<String> tags = currentMeme.getTags();
        if (tags != null && !tags.isEmpty()) {
            MatchOperation matchTags = Aggregation.match(
                    Criteria.where("_id").ne(memeId).and("tags").in(tags));

            AggregationExpression tagMatchScoreExpr = context -> new Document("$size",
                    new Document("$setIntersection", List.of("$tags", tags)));

            AggregationExpression engagementScoreExpr = context -> new Document("$add", List.of(
                    new Document("$multiply", List.of("$likecount", 2)),
                    new Document("$multiply", List.of("$commentsCount", 1.5)),
                    new Document("$multiply", List.of("$saveCount", 1)),
                    new Document("$multiply", List.of("$views", 0.5))));

            ProjectionOperation project = Aggregation.project(
                    "id", "UserId", "mediaUrl", "mediaType", "caption", "uploader",
                    "likecount", "commentsCount", "tags", "profilePictureUrl", "views", "saveCount")
                    .and(tagMatchScoreExpr).as("tagMatchScore")
                    .and(engagementScoreExpr).as("engagementScore");

            Aggregation aggregation = Aggregation.newAggregation(
                    matchTags,
                    project,
                    Aggregation.sort(Sort.by(Sort.Direction.DESC, "tagMatchScore", "engagementScore")),
                    Aggregation.limit(30));

            AggregationResults<Document> tagResults = mongoTemplate.aggregate(aggregation, "memes", Document.class);
            for (Document doc : tagResults.getMappedResults()) {
                Meme meme = mapToMeme(doc);
                if (addedIds.add(meme.getId())) {
                    allCandidates.add(meme);
                }
            }
        }

        Query trendingQuery = new Query()
                .addCriteria(Criteria.where("_id").ne(memeId))
                .with(Sort.by(Sort.Direction.DESC, "likecount", "memeCreated"))
                .limit(50);
        for (Meme meme : mongoTemplate.find(trendingQuery, Meme.class)) {
            if (addedIds.add(meme.getId())) {
                allCandidates.add(meme);
            }
        }

        int start = Math.min((page - 1) * limit, allCandidates.size());
        int end = Math.min(start + limit, allCandidates.size());

        List<Meme> paginatedResults = allCandidates.subList(start, end);

        log.info("🔁 Returning {} related memes (page {}) for memeId='{}'", paginatedResults.size(), page, memeId);
        return paginatedResults;
    }

    private Meme mapToMeme(Document doc) {
        Meme meme = new Meme();
        meme.setId(doc.getObjectId("_id").toHexString());
        meme.setMediaUrl(doc.getString("mediaUrl"));
        meme.setCaption(doc.getString("caption"));
        Object tagsObj = doc.get("tags");
        List<String> tagsList = new ArrayList<>();
        if (tagsObj instanceof List<?>) {
            for (Object tag : (List<?>) tagsObj) {
                if (tag instanceof String) {
                    tagsList.add((String) tag);
                }
            }
        }
        meme.setTags(tagsList);
        meme.setUploader(doc.getString("uploader"));
        meme.setProfilePictureUrl(doc.getString("profilePictureUrl"));
        meme.setUserId(doc.getString("UserId"));
        meme.setCommentsCount(doc.getInteger("commentsCount", 0));
        meme.setMediaType(doc.getString("mediaType"));
        meme.setLikecount(doc.getInteger("likecount", 0));
        meme.setMemeCreated(doc.getDate(meme));
        return meme;
    }

}
