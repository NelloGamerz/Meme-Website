package com.example.Meme.Website.Scheduler;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.models.Comments;
import com.example.Meme.Website.models.FollowersModel;
import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.models.userModel;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ProfileUpdateAsync {
    
    @Autowired
    private MongoTemplate mongoTemplate;

    @Async
    public void propagate(String userId, Map<String, String> updates) {
        if (updates.containsKey("profilePictureUrl")) {
            String newPic = updates.get("profilePictureUrl");
            updateMemeProfilePictures(userId, newPic);
            updateCommentProfilePictures(userId, newPic);
            updateFollowerData(userId, newPic);
            updateProfilePictureInFollowersAndFollowing(userId, newPic);
        }

        if (updates.containsKey("username")) {
            String newUsername = updates.get("username");
            updateMemeUsernames(userId, newUsername);
            updateCommentUsernames(userId, newUsername);
            updateFollowerUsernameData(userId, newUsername);
            updateFollowerUsernameInUserModel(userId, newUsername);
        }

        log.info("🔁 Async propagation done for userId: {}", userId);
    }

    private void updateMemeProfilePictures(String userId, String newImageUrl) {
        mongoTemplate.updateMulti(
                new Query(Criteria.where("userId").is(userId)),
                new Update().set("profilePictureUrl", newImageUrl),
                Meme.class);
    }

    private void updateCommentProfilePictures(String userId, String newImageUrl) {
        mongoTemplate.updateMulti(
                new Query(Criteria.where("userId").is(userId)),
                new Update().set("profilePictureUrl", newImageUrl),
                Comments.class);
    }

    private void updateFollowerData(String userId, String newImageUrl) {
        mongoTemplate.updateMulti(
                new Query(Criteria.where("Followers.userId").is(userId)),
                new Update().set("Followers.$.profilePictureUrl", newImageUrl),
                FollowersModel.class);

        mongoTemplate.updateMulti(
                new Query(Criteria.where("Following.userId").is(userId)),
                new Update().set("Following.$.profilePictureUrl", newImageUrl),
                FollowersModel.class);
    }

    private void updateProfilePictureInFollowersAndFollowing(String userId, String newImageUrl) {
        mongoTemplate.updateMulti(
                new Query(Criteria.where("Followers.userId").is(userId)),
                new Update().set("Followers.$[elem].profilePictureUrl", newImageUrl)
                        .filterArray(Criteria.where("elem.userId").is(userId)),
                FollowersModel.class);

        mongoTemplate.updateMulti(
                new Query(Criteria.where("Following.userId").is(userId)),
                new Update().set("Following.$[elem].profilePictureUrl", newImageUrl)
                        .filterArray(Criteria.where("elem.userId").is(userId)),
                FollowersModel.class);
    }

    private void updateMemeUsernames(String userId, String newUsername) {
        mongoTemplate.updateMulti(
                new Query(Criteria.where("userId").is(userId)),
                new Update().set("uploader", newUsername),
                Meme.class);
    }

    private void updateCommentUsernames(String userId, String newUsername) {
        mongoTemplate.updateMulti(
                new Query(Criteria.where("userId").is(userId)),
                new Update().set("username", newUsername),
                Comments.class);
    }

    private void updateFollowerUsernameData(String userId, String newUsername) {
        mongoTemplate.updateMulti(
                new Query(Criteria.where("Followers.userId").is(userId)),
                new Update().set("Followers.$.username", newUsername),
                FollowersModel.class);

        mongoTemplate.updateMulti(
                new Query(Criteria.where("Following.userId").is(userId)),
                new Update().set("Following.$.username", newUsername),
                FollowersModel.class);
    }

    private void updateFollowerUsernameInUserModel(String userId, String newUsername) {
        mongoTemplate.updateMulti(
                new Query(Criteria.where("Followers.userId").is(userId)),
                new Update().set("Followers.$[elem].username", newUsername)
                        .filterArray(Criteria.where("elem.userId").is(userId)),
                userModel.class);

        mongoTemplate.updateMulti(
                new Query(Criteria.where("Following.userId").is(userId)),
                new Update().set("Following.$[elem].username", newUsername)
                        .filterArray(Criteria.where("elem.userId").is(userId)),
                userModel.class);
    }
}
