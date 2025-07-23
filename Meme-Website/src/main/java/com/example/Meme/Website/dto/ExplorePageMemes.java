package com.example.Meme.Website.dto;

import java.util.List;

import com.example.Meme.Website.models.Meme;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExplorePageMemes {
    private List<Meme> trending;
    private List<Meme> basedOnInterest;
    private List<Meme> followingMemes;
    private List<Meme> hot;
}
