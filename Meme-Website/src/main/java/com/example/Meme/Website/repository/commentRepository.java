package com.example.Meme.Website.repository;


import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.Meme.Website.models.Comments;

@Repository
public interface commentRepository extends MongoRepository<Comments, String>{
    Page<Comments> findByMemeId(String memeId, Pageable pagaeble);
    void deleteAllByMemeIdIn(List<String> memeIds);
}
