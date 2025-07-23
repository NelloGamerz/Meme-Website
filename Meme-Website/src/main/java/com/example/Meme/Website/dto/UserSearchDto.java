package com.example.Meme.Website.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchDto {
    private String userId;
    private String username;
    private String profilePictureUrl; 
    private long FollowersCount;  
}
