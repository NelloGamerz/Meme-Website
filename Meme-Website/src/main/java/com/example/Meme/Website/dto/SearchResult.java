package com.example.Meme.Website.dto;

import java.util.List;

import com.example.Meme.Website.models.Meme;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SearchResult {
    private List<UserSearchDto> users;
    private List<Meme> memes;
}
