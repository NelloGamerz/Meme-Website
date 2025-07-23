package com.example.Meme.Website.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.Meme.Website.models.Meme;

@Repository
public interface memeRepository extends MongoRepository<Meme, String> {
        List<Meme> findByUploader(String uploader);

        List<Meme> findByCaption(String regex, String options);

        @Query("{ 'caption': { $regex: ?0, $options: 'i' } }") // Case-insensitive regex search
        List<Meme> findByCaptionRegex(String caption);

        @Query(value = "{ 'caption': { $regex: ?0, $options: 'i' } }", fields = "{ comments: 0, saveCount: 0, memeCreated: 0 }")
        List<Meme> findByCaptionRegexExcludeComments(String regex);

        @Query(value = "{ '_id': { $in: ?0 } }", fields = "{ comments: 0, saveCount: 0, memeCreated: 0 }")
        Set<Meme> findByIdInExcludeComments(Set<String> ids);

        List<Meme> findTopByOrderByLikecountDesc(Pageable pageable);

        List<Meme> findByUploaderIn(List<String> uploadersId);

        List<Meme> findByTagsIn(List<String> tags);

        Page<Meme> findByMemeCreatedAfter(LocalDateTime since, Pageable pageable);

        // Page<Meme> findByTagsInAndIdNotIn(List<String> tags, Set<String> seenIds,
        // Pageable pageable);
        // List<Meme> findByUploaderIdIn(List<String> uploaderIds, Pageable pageable);

        @Query("{ 'createdAt': { $gte: ?0 }, 'views': { $gte: ?1 } }")
        List<Meme> findHotMemes(LocalDateTime since, int minViews, Pageable pageable);

        @Aggregation(pipeline = {
                        "{ $match: { _id: { $in: ?0 } } }",
                        "{ $unwind: '$tags' }",
                        "{ $group: { _id: null, tags: { $addToSet: '$tags' } } }"
        })
        List<Map<String, Object>> findSeenTags(List<String> seenIds);

        // List<Meme> findByUploaderInAndIdNotIn(List<String> uploaderIds, Set<String>
        // seenIds, Pageable pageable);
        // List<Meme> findByUploaderAndIdNotIn(String uploaderusername, Set<String>
        // seenMemes, Pageable pageable);

        @Query("{ 'uploader': { $in: ?0 }, '_id': { $nin: ?1 } }")
        List<Meme> findByUploaderInAndIdNotIn(List<String> uploaderUsernames, Collection<String> excludedIds,
                        Pageable pageable);

        @Query("{ 'tags': { $in: ?0 }, '_id': { $nin: ?1 } }")
        List<Meme> findByTagsInAndIdNotIn(List<String> tags, Collection<String> excludedIds, Pageable pageable);

        Page<Meme> findByOrderByMemeCreatedDesc(Pageable pageable);

        // Get latest meme by a user
        Meme findTopByUploaderOrderByMemeCreatedDesc(String uploaderId);

        // Get all memes excluding one
        List<Meme> findByIdNot(String memeId);

        List<Meme> findByMemeCreatedAfterOrderByMemeCreatedDesc(LocalDateTime time);

        List<Meme> findByIdNotIn(List<String> ids);

        List<Meme> findByMemeCreatedAfterAndIdNotInOrderByMemeCreatedDesc(LocalDateTime createdAfter,
                        Set<String> excludedIds);

        List<Meme> findByMemeCreatedBeforeAndIdNotIn(LocalDateTime createdBefore, Set<String> excludedIds);

        // @Query(value = "{ 'userId': ?0 }", fields = "{ '_id': 1 }")
        @Query(value = "{ 'userId': ?0 }", fields = "{ 'memeId': 1, '_id': 0 }")
        Slice<String> findMemeIdsByUserId(String userId, Pageable pageable);

        // For fetching memes by IDs
        List<Meme> findByIdIn(Set<ObjectId> memeIds);

        List<Meme> findByTagsInAndMemeCreatedAfterAndIdNotInOrderByMemeCreatedDesc(List<String> tags,
                        LocalDateTime after, Set<String> excludeIds);

        List<Meme> findByTagsInAndMemeCreatedBeforeAndIdNotIn(List<String> tags, LocalDateTime before,
                        Set<String> excludeIds);

        @Query("SELECT m FROM Meme m ORDER BY m.likeCount DESC, m.memeCreated DESC")
        List<Meme> findGlobalMemes();

}
