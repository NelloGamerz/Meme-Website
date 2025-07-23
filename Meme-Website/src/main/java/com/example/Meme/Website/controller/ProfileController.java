package com.example.Meme.Website.controller;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.Meme.Website.services.ProfileService;


@RestController
@RequestMapping("/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping("/{username}")
    public ResponseEntity<?> userProfile(
            @PathVariable String username) {
        return profileService.userProfile(username);
    }

    @GetMapping("/{userId}/{type}")
    public ResponseEntity<?> getFollowData(
            @PathVariable String userId,
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit) {
        return profileService.getFollowData(userId, offset, limit, type);
    }


    @GetMapping("user-memes/{userId}/")
    public ResponseEntity<?> getUserMemes(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "UPLOAD") String type) {
        return profileService.getUserProfileMemes(userId, offset, limit, type);
    }

}
