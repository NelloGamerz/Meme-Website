package com.example.Meme.Website.models;

import java.util.Date;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "Comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comments {
    private String id;
    private String userId;
    private String memeId;
    private String username;
    private String text;
    private Date createdAt;
    private String ProfilePictureUrl;
}
