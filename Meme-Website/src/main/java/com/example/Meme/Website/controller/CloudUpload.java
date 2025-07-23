package com.example.Meme.Website.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Meme.Website.dto.BatchPresignRequest;
import com.example.Meme.Website.dto.MemeuploadRequest;
import com.example.Meme.Website.dto.PresignRequest;
import com.example.Meme.Website.dto.PresignResponse;
import com.example.Meme.Website.dto.ProfileUpdateRequest;
import com.example.Meme.Website.services.CloudService;
import com.example.Meme.Website.services.ProfileService;
import com.example.Meme.Website.services.S3PresignService;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/upload")
public class CloudUpload {

    @Autowired
    private S3PresignService s3PresignService;

    @Autowired
    private CloudService cloudService;
    @Autowired
    private ProfileService profileService;

    @PostMapping("/presign-temp")
    public ResponseEntity<List<PresignResponse>> presignTempUpload(@RequestBody BatchPresignRequest req) {
        List<PresignResponse> responses = new ArrayList<>();

        for (PresignRequest file : req.getFiles()) {
            String folder = switch (file.getType().toLowerCase()) {
                case "meme" -> "memes/temp";
                case "profile_picture" -> "profile/profile_pictures";
                case "profile_banner" -> "profile/profile_banners";
                default -> throw new IllegalArgumentException("Invalid file type: " + file.getType());
            };

            PresignResponse presigned = s3PresignService.generatePresignedUrl(
                    file.getFilename(),
                    folder,
                    req.getUserId(),
                    true);

            responses.add(presigned);
        }

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/meme")
    public ResponseEntity<String> finalizeUpload(@RequestBody MemeuploadRequest req) {
        cloudService.finalizeMemeuplaod(req);
        return ResponseEntity.ok("Meme uploaded Successfully.");
    }

    @PatchMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody ProfileUpdateRequest req,
            HttpServletResponse response) {
        Map<String, Object> result = new HashMap<>();
        String username = req.getUsername();
        String userId = req.getUserId();

        if (username != null && !username.trim().isEmpty()) {
            ResponseEntity<?> usernameResult = profileService.changeUsername(
                    userId, Map.of("newUsername", username), response);

            if (!usernameResult.getStatusCode().is2xxSuccessful()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> errorBody = (Map<String, Object>) usernameResult.getBody();
                return ResponseEntity.status(usernameResult.getStatusCode()).body(errorBody);
            }

            if (usernameResult.getBody() instanceof Map<?, ?>) {
                @SuppressWarnings("unchecked")
                Map<String, Object> usernameBody = (Map<String, Object>) usernameResult.getBody();
                result.putAll(usernameBody);
            }
        }

        if (req.getProfileBannerUrl() != null || req.getProfilePictureUrl() != null) {
            cloudService.updateProfile(req, response);
            if (req.getProfilePictureUrl() != null) {
                result.put("profilePictureUrl", req.getProfilePictureUrl());
            }
            if (req.getProfileBannerUrl() != null) {
                result.put("profileBannerUrl", req.getProfileBannerUrl());
            }
        }

        return ResponseEntity.ok(result);
    }

}
