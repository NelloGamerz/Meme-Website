package com.example.Meme.Website.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemeFeedResponse {
    private List<MemeDto> memes;
    private boolean hasNextPage;
}
