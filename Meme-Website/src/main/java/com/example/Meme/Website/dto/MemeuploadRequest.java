package com.example.Meme.Website.dto;


import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemeuploadRequest {
    private String profilePictureUrl;
    private String tempKey;
    private String title;
    private String category;
    private List<String> tags;
}
