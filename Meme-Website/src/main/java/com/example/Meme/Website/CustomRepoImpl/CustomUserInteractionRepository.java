package com.example.Meme.Website.CustomRepoImpl;

import java.util.Collection;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import com.example.Meme.Website.DBO.MemeInteractionDBO;
import com.example.Meme.Website.models.ActionType;

public interface CustomUserInteractionRepository {
    Slice<MemeInteractionDBO> findUserInteractionMemeIdsByType(String userId, Collection<String> memeIds, Collection<ActionType> types, Pageable pageable);
}
