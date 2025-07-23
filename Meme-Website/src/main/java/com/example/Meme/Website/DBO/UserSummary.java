package com.example.Meme.Website.DBO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSummary {
    private String userId;
    private String username;
    private String profilePictureUrl;
}
