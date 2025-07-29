package com.example.Meme.Website.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    private String profilePictureUrl;
    private String profileBannerUrl;
    private String newUsername;
}
