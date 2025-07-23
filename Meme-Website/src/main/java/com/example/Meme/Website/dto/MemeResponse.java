package com.example.Meme.Website.dto;

import java.util.Date;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemeResponse {
    private String UserId;
    private String mediaUrl;
    private String caption;
    private String uploader;
    private int likecount;
    private int saveCount;
    private Date memeCreated;
    private int commentsCount;
    private int viewCount;
    private List<String> tags;
    private String profilePictureUrl;
    private String category;
}
