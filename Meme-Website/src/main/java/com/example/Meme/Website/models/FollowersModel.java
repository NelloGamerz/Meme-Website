package com.example.Meme.Website.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "followers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowersModel {
    @Id
    private String id;

    @Indexed
    private String followerUserId;

    @Indexed
    private String followedUserId;

    private Date followDate;
}
