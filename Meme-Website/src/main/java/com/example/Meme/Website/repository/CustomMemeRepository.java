package com.example.Meme.Website.repository;

import java.util.List;

import com.example.Meme.Website.models.Meme;

public interface CustomMemeRepository {
    List<Meme> findRelatedMemes(String memeId, String userId, int page, int limit);
}
