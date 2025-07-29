package com.example.Meme.Website.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.Meme.Website.models.UserPrincipal;
import com.example.Meme.Website.services.ProfileService;


@RestController
@RequestMapping("/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping()
    public ResponseEntity<?> userProfile(
            @AuthenticationPrincipal UserPrincipal user) {
                String username = user.getUsername();
        return profileService.userProfile(username);
    }

    @GetMapping("/FollowType/{type}")
    public ResponseEntity<?> getFollowData(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit) {
                String userId = user.getUserId();
        return profileService.getFollowData(userId, offset, limit, type);
    }


    @GetMapping("/user-memes")
    public ResponseEntity<?> getUserMemes(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "UPLOAD") String type) {
                String userId = user.getUserId();
        return profileService.getUserProfileMemes(userId, offset, limit, type);
    }

}
