package com.example.Meme.Website.dto;

import com.example.Meme.Website.models.Meme;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoreMeme {
    private Meme meme;
    private double score;
}
