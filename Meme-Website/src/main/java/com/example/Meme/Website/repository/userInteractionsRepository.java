package com.example.Meme.Website.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.example.Meme.Website.CustomRepoImpl.CustomUserInteractionRepository;
import com.example.Meme.Website.DBO.MemeIdDBO;
import com.example.Meme.Website.DBO.MemeInteractionDBO;
import com.example.Meme.Website.models.ActionType;
import com.example.Meme.Website.models.UserInteraction;

public interface userInteractionsRepository
        extends MongoRepository<UserInteraction, String>, CustomUserInteractionRepository {

    @Query(value = "{ 'userId': ?0, 'type': ?1}", fields = "{ 'memeId': 1, 'timestamp': 0, '_id': 0}")
    Slice<UserInteraction> findByUserIdAndType(String userId, ActionType type, Pageable pageable);

    Slice<UserInteraction> findByMemeIdAndType(String memeId, ActionType type, Pageable pageable);

    Slice<UserInteraction> findByUserIdAndMemeIdInAndTypeIn(String userId, Collection<String> memeId,
            Collection<ActionType> type, Pageable pageable);

    boolean existsByUserIdAndMemeIdAndType(String userId, String memeId, ActionType type);

    void deleteByUserIdAndMemeIdAndType(String userId, String memeId, ActionType type);

    Slice<MemeInteractionDBO> findUserInteractionMemeIdsByType(String userId, Collection<String> memeIds,
            Collection<ActionType> types, Pageable pageable);

    @Query(value = "{ 'userId': ?0, 'type': ?1 }", fields = "{ 'memeId': 1, '_id': 0 }")
    Slice<MemeIdDBO> findMemeIdsByUserIdAndType(String userId, ActionType type, Pageable pageable);
    void deleteAllByMemeIdIn(List<String> memeIds);
}
