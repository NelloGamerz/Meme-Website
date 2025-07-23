package com.example.Meme.Website.services;

import java.util.Date;
import java.util.Map;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Meme.Website.Exceptions.CustomExceptions;
import com.example.Meme.Website.batch.InteractionBatchBuffer;
import com.example.Meme.Website.batch.MemeBatchBuffer;
import com.example.Meme.Website.batch.ProfilebatchBuffer;
import com.example.Meme.Website.dto.MemeuploadRequest;
import com.example.Meme.Website.dto.ProfileUpdateRequest;
import com.example.Meme.Website.models.ActionType;
import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.models.UserInteraction;
import com.example.Meme.Website.models.userModel;

import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;

import com.example.Meme.Website.repository.userRepository;

import jakarta.servlet.http.HttpServletResponse;

@Service
@Slf4j
public class CloudService {

    @Autowired
    private S3Client s3Client;
    @Autowired
    private userRepository userRepository;
    @Autowired
    private MemeBatchBuffer memeBuffer;
    @Autowired
    private InteractionBatchBuffer interactionBuffer;
    @Autowired
    private ProfilebatchBuffer profileBuffer;
    @Autowired
    private ProfileService profileService;

    @Value("${aws.s3.bucket}")
    private String bucket;
    @Value("${aws.region}")
    private String region;

    public void finalizeMemeuplaod(MemeuploadRequest req) {
        String tempKey = req.getTempKey();
        String userId = req.getUserId();
        String fileName = tempKey.substring(tempKey.lastIndexOf("/") + 1);
        String finalKey = "memes/final/" + userId + "_" + fileName;

        try {
            HeadObjectResponse head = s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(tempKey)
                    .build());

            String contentType = head.contentType();
            long size = head.contentLength();

            boolean isImage = contentType.startsWith("image/");
            boolean isVideo = contentType.startsWith("video/");

            if (!isImage && !isVideo) {
                throw new RuntimeException("Only image, gif, or video files are allowed.");
            }

            if (isImage && size > 1_000_000) {
                throw new RuntimeException("Image must be ≤ 1MB.");
            }

            if (isVideo && size > 5_000_000) {
                throw new RuntimeException("Video must be ≤ 5MB.");
            }

            s3Client.copyObject(CopyObjectRequest.builder()
                    .sourceBucket(bucket)
                    .sourceKey(tempKey)
                    .destinationBucket(bucket)
                    .destinationKey(finalKey)
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .build());

            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(tempKey)
                    .build());

            String memeId = new ObjectId().toString();

            Meme meme = new Meme();
            meme.setId(memeId);
            meme.setUserId(userId);
            meme.setUploader(req.getUploader());
            meme.setProfilePictureUrl(req.getProfilePictureUrl());
            meme.setCaption(req.getTitle());
            meme.setCategory(req.getCategory());
            meme.setTags(req.getTags());
            meme.setMediaUrl("https://" + bucket + ".s3." + region + ".amazonaws.com/" + finalKey);
            meme.setFileSize(size);
            meme.setMediaType(contentType);
            meme.setMemeCreated(new Date());
            meme.setDeleted(false);

            memeBuffer.bufferMemeInsert(meme);

            UserInteraction uploadInteraction = new UserInteraction();
            uploadInteraction.setUserId(userId);
            uploadInteraction.setMemeId(memeId);
            uploadInteraction.setType(ActionType.UPLOAD);
            uploadInteraction.setTimestamp(new Date());

            interactionBuffer.bufferInsert(uploadInteraction);
        } catch (Exception ex) {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(finalKey)
                    .build());

            throw new RuntimeException("Failed to upload meme: " + ex.getMessage(), ex);
        }
    }

    @Transactional
    public void updateProfile(ProfileUpdateRequest req, HttpServletResponse httpResponse) {
        userModel user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new CustomExceptions.UserNotFoundException("User not found"));

        String userId = req.getUserId();

        if (req.getProfilePictureUrl() != null && !req.getProfilePictureUrl().isBlank()) {
            String oldPic = user.getProfilePictureUrl();
            if (oldPic != null && oldPic.contains(".s3.")) {
                deleteFromS3ByPublicUrl(oldPic);
            }
            profileBuffer.bufferProfilePicture(userId, req.getProfilePictureUrl());
            // profileBuffer.markUserIdForPropagation(userId);
        }

        if (req.getProfileBannerUrl() != null && !req.getProfileBannerUrl().isBlank()) {
            String oldBanner = user.getProfileBannerUrl();
            if (oldBanner != null && oldBanner.contains(".s3.")) {
                deleteFromS3ByPublicUrl(oldBanner);
            }
            profileBuffer.bufferProfileBanner(userId, req.getProfileBannerUrl());
        }

        if (req.getUsername() != null && !req.getUsername().isBlank()) {
            if (!req.getUsername().equals(req.getPreviousUsername())) {
                Map<String, String> usernameUpdateMap = Map.of("newUsername", req.getUsername());

                ResponseEntity<?> usernameChangeResult = profileService.changeUsername(
                        req.getUserId(), usernameUpdateMap, httpResponse);

                if (usernameChangeResult.getStatusCode().isError()) {
                    throw new RuntimeException("Username change failed: " + usernameChangeResult.getBody());
                }
            }
        }
    }

    public boolean deleteFromS3ByPublicUrl(String publicUrl) {
        String key = extractS3KeyFromUrl(publicUrl);
        if (key == null || key.isEmpty()) {
            return false;
        }

        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            return true;
        } catch (Exception e) {
            log.warn("Failed to delete from S3: " + key, e);
            return false;
        }
    }

    private String extractS3KeyFromUrl(String publicUrl) {
        String baseUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/";
        if (publicUrl.startsWith(baseUrl)) {
            return publicUrl.substring(baseUrl.length());
        }
        return null;
    }

}
