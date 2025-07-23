package com.example.Meme.Website.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PresignResponse {
    private String uploadedUrl;
    private String publicUrl;
    private String tmepKey;
}
