package com.example.Meme.Website.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.Meme.Website.models.FollowersModel;

@Repository
public interface followersRepository extends MongoRepository<FollowersModel, String> {
    Page<FollowersModel> findByFollowedUserId(String userId, Pageable pageable);

    Page<FollowersModel> findByFollowerUserId(String userId, Pageable pageable);

    boolean existsByFollowerUserIdAndFollowedUserId(String followerUserId, String followedUserId);

    long deleteByFollowerUserIdAndFollowedUserId(String followerUserId, String followedUserId);

    // Get recently followed user IDs for a user, sorted by followDate descending
    @Query("{ 'followerUserId': ?0 }")
    List<FollowersModel> findByFollowerUserIdOrderByFollowDateDesc(String followerUserId);

    @Query("{ 'followerId': ?0 }")
    List<String> findFollowingIdsByFollowerId(String followerId);

}
