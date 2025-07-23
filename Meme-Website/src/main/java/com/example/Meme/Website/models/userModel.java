package com.example.Meme.Website.models;

import java.util.Date;

import java.util.Map;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mongodb.lang.NonNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "Users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class userModel {
    @Id
    private String userId;
    @Indexed(unique = true)
    @NonNull
    private String username;
    @NonNull
    private String email;
    @NonNull
    private String password;
    private Date userCreated;
    private Date userUpdated;
    private Map<String, Integer> tagInteractions;
    private String profilePictureUrl;
    private String profileBannerUrl;
    private long followersCount;
    private long followingCount;
    private long uploadCount;
}
