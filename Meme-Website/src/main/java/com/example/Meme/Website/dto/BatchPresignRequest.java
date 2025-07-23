package com.example.Meme.Website.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BatchPresignRequest {
    private String userId;
    private List<PresignRequest> files;
}
