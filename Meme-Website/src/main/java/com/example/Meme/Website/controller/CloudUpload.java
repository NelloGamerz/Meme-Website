package com.example.Meme.Website.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import com.example.Meme.Website.models.UserPrincipal;
import com.example.Meme.Website.services.CloudService;
import com.example.Meme.Website.services.S3PresignService;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/upload")
public class CloudUpload {

    @Autowired
    private S3PresignService s3PresignService;

    @Autowired
    private CloudService cloudService;

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
    public ResponseEntity<String> finalizeUpload(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody MemeuploadRequest req) {
        String username = user.getUsername();
        String userId = user.getUserId();
        cloudService.finalizeMemeuplaod(req, username, userId);
        return ResponseEntity.ok("Meme uploaded Successfully.");
    }

    @PatchMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody ProfileUpdateRequest req,
            HttpServletResponse res) {

        try {
            Map<String, Object> updatedData = cloudService.updateProfile(req, res, user.getUserId(),
                    user.getUsername());
            return ResponseEntity.ok(updatedData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Profile update failed", "error", e.getMessage()));
        }
    }

}
