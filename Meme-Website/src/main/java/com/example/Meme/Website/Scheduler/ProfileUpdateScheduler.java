// package com.example.Meme.Website.Scheduler;

// import java.util.List;
// import java.util.Map;
// import java.util.Set;
// import java.util.stream.Collectors;

// import org.bson.Document;
// import org.bson.types.ObjectId;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.data.mongodb.core.MongoTemplate;
// import org.springframework.data.mongodb.core.query.Criteria;
// import org.springframework.data.mongodb.core.query.Query;
// import org.springframework.data.mongodb.core.query.Update;
// import org.springframework.scheduling.annotation.Scheduled;
// import org.springframework.stereotype.Component;

// import com.example.Meme.Website.batch.ProfilebatchBuffer;
// import com.example.Meme.Website.models.Comments;
// import com.example.Meme.Website.models.FollowersModel;
// import com.example.Meme.Website.models.Meme;
// import com.example.Meme.Website.models.userModel;
// import com.mongodb.bulk.BulkWriteResult;
// import com.mongodb.client.model.Filters;
// import com.mongodb.client.model.UpdateOneModel;

// import lombok.extern.slf4j.Slf4j;

// @Slf4j
// @Component
// public class ProfileUpdateScheduler {

//     @Autowired
//     private ProfilebatchBuffer buffer;

//     @Autowired
//     private MongoTemplate mongoTemplate;

//     @Scheduled(fixedDelay = 5000)
//     public void propagateProfileUpdates() {
//         Set<String> userIds = buffer.drainMarkedUserIds();
//         Map<String, String> picUpdates = buffer.getProfilePictureUpdates();
//         Map<String, String> bannerUpdates = buffer.getProfileBannerUpdates();
//         Map<String, String> usernameUpdates = buffer.getUsernameUpdates();

//         if (userIds.isEmpty())
//             return;

//         List<UpdateOneModel<Document>> updateOps = userIds.stream()
//                 .map(userId -> {
//                     Document updateFields = new Document();
//                     if (picUpdates.containsKey(userId)) {
//                         updateFields.append("profilePictureUrl", picUpdates.get(userId));
//                     }
//                     if (bannerUpdates.containsKey(userId)) {
//                         updateFields.append("profileBannerUrl", bannerUpdates.get(userId));
//                     }
//                     if (usernameUpdates.containsKey(userId)) {
//                     updateFields.append("username", usernameUpdates.get(userId));
//                 }

//                     return new UpdateOneModel<Document>(
//                             Filters.eq("_id", new ObjectId(userId)),
//                             new Document("$set", updateFields));
//                 })
//                 .collect(Collectors.toList());

//         if (!updateOps.isEmpty()) {
//             BulkWriteResult result = mongoTemplate
//                     .getDb()
//                     .getCollection("Users")
//                     .bulkWrite(updateOps);

//             log.info("🧾 Bulk updated userModel for {} users", result.getModifiedCount());
//         }

//         userIds.forEach(userId -> {
//             if (picUpdates.containsKey(userId)) {
//                 String newPic = picUpdates.get(userId);
//                 updateMemeProfilePictures(userId, newPic);
//                 updateCommentProfilePictures(userId, newPic);
//                 updateFollowerData(userId, newPic);
//                 updateProfilePictureInFollowersAndFollowing(userId, newPic);
//             }

//             if (usernameUpdates.containsKey(userId)) {
//             String newUsername = usernameUpdates.get(userId);
//             updateMemeUsernames(userId, newUsername);
//             updateCommentUsernames(userId, newUsername);
//             updateFollowerUsernameData(userId, newUsername);
//             updateFollowerUsernameInUserModel(userId, newUsername);
//         }
//         });

//         buffer.clear();
//     }

//     private void updateMemeProfilePictures(String userId, String newImageUrl) {
//         mongoTemplate.updateMulti(
//                 new Query(Criteria.where("userId").is(userId)),
//                 new Update().set("profilePictureUrl", newImageUrl),
//                 Meme.class);
//     }

//     private void updateCommentProfilePictures(String userId, String newImageUrl) {
//         mongoTemplate.updateMulti(
//                 new Query(Criteria.where("userId").is(userId)),
//                 new Update().set("profilePictureUrl", newImageUrl),
//                 Comments.class);
//     }

//     private void updateFollowerData(String userId, String newImageUrl) {
//         mongoTemplate.updateMulti(
//                 new Query(Criteria.where("Followers.userId").is(userId)),
//                 new Update().set("Followers.$.profilePictureUrl", newImageUrl),
//                 FollowersModel.class);

//         mongoTemplate.updateMulti(
//                 new Query(Criteria.where("Following.userId").is(userId)),
//                 new Update().set("Following.$.profilePictureUrl", newImageUrl),
//                 FollowersModel.class);
//     }

//     private void updateProfilePictureInFollowersAndFollowing(String userId, String newImageUrl) {
//         mongoTemplate.updateMulti(
//                 new Query(Criteria.where("Followers.userId").is(userId)),
//                 new Update().set("Followers.$[elem].profilePictureUrl", newImageUrl)
//                         .filterArray(Criteria.where("elem.userId").is(userId)),
//                 userModel.class);

//         mongoTemplate.updateMulti(
//                 new Query(Criteria.where("Following.userId").is(userId)),
//                 new Update().set("Following.$[elem].profilePictureUrl", newImageUrl)
//                         .filterArray(Criteria.where("elem.userId").is(userId)),
//                 userModel.class);
//     }


//     private void updateMemeUsernames(String userId, String newUsername) {
//     mongoTemplate.updateMulti(
//             new Query(Criteria.where("userId").is(userId)),
//             new Update().set("uploader", newUsername),
//             Meme.class);
// }

// private void updateCommentUsernames(String userId, String newUsername) {
//     mongoTemplate.updateMulti(
//             new Query(Criteria.where("userId").is(userId)),
//             new Update().set("username", newUsername),
//             Comments.class);
// }

// private void updateFollowerUsernameData(String userId, String newUsername) {
//     mongoTemplate.updateMulti(
//             new Query(Criteria.where("Followers.userId").is(userId)),
//             new Update().set("Followers.$.username", newUsername),
//             FollowersModel.class);

//     mongoTemplate.updateMulti(
//             new Query(Criteria.where("Following.userId").is(userId)),
//             new Update().set("Following.$.username", newUsername),
//             FollowersModel.class);
// }

// private void updateFollowerUsernameInUserModel(String userId, String newUsername) {
//     mongoTemplate.updateMulti(
//             new Query(Criteria.where("Followers.userId").is(userId)),
//             new Update().set("Followers.$[elem].username", newUsername)
//                     .filterArray(Criteria.where("elem.userId").is(userId)),
//             userModel.class);

//     mongoTemplate.updateMulti(
//             new Query(Criteria.where("Following.userId").is(userId)),
//             new Update().set("Following.$[elem].username", newUsername)
//                     .filterArray(Criteria.where("elem.userId").is(userId)),
//             userModel.class);
// }

// }



package com.example.Meme.Website.Scheduler;

import java.util.Map;
import java.util.Set;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.Meme.Website.batch.ProfilebatchBuffer;
import com.example.Meme.Website.models.userModel;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class ProfileUpdateScheduler {

    @Autowired
    private ProfilebatchBuffer buffer;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private ProfileUpdateAsync asyncPropagator;

    @Scheduled(fixedDelay = 5000)
    public void propagateProfileUpdates() {
        Set<String> userIds = buffer.getMarkedUserIds();
        if (userIds.isEmpty()) return;

        for (String userId : userIds) {
            Map<String, String> updates = buffer.drainProfileUpdates(userId);
            if (updates.isEmpty()) continue;

            // 1. Update Users collection immediately
            Update update = new Update();
            updates.forEach(update::set);

            mongoTemplate.updateFirst(
                    new Query(Criteria.where("_id").is(new ObjectId(userId))),
                    update,
                    userModel.class
            );

            log.info("✅ Updated Users collection for userId={} with fields={}", userId, updates.keySet());

            // 2. Run propagation asynchronously
            asyncPropagator.propagate(userId, updates);
        }
    }
}
