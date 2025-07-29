package com.example.Meme.Website.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.repository.memeRepository;

@Service
public class TrendingCacheService {

    private static final long TRENDING_TTL_MINUTES = 1;
    private static final String TRENDING_KEY = "trending:global";
    
    @Autowired
    private memeRepository memeRepository;
    @Autowired
    private RedisService redisService;


    public List<Meme> getTrendingMemes(){
        List<Meme> cached = redisService.getList(TRENDING_KEY, Meme.class);
        if(!cached.isEmpty()){
            return cached;
        }

        return refreshTrendingMemes();
    }

    public List<Meme> refreshTrendingMemes(){
        LocalDateTime since = LocalDateTime.now().minusHours(168);
        List<Meme>trending = memeRepository.findByMemeCreatedAfter(
            since,
            PageRequest.of(0, 20, Sort.by(Sort.Order.desc("likecount"), Sort.Order.desc("viewCount")))
        ).getContent();

        redisService.set(TRENDING_KEY, trending, TRENDING_TTL_MINUTES, TimeUnit.MINUTES);
        return trending;
    }
}
