package com.example.Meme.Website.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.Meme.Website.DBO.UserSummary;
import com.example.Meme.Website.dto.UserSearchDto;
import com.example.Meme.Website.models.userModel;

@Repository
public interface userRepository extends MongoRepository<userModel, String> {
    Optional<userModel> findByEmail(String email);

    Optional<userModel> findByUsername(String username);

    @Query(value = "{ 'username': { $regex: ?0, $options: 'i' } }", fields = "{ 'userId': 1, 'username': 1, 'profilePictureUrl': 1, 'FollowersCount': 1 }")
    List<UserSearchDto> findUsersByUsernameRegex(String regex);

    Optional<userModel> findByUserId(String userId);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    // List<userModel> findTop100ByOrderByLastActiveDesc();

    @Query(value = "{ '_id': { $in: ?0 } }", fields = "{ 'username': 1 }")
    List<String> findUsernamesByIds(List<String> ids);

    List<UserSummary> findUserSummariesByUserIdIn(List<String> followersIds);


}
