package com.example.Meme.Website.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Meme.Website.dto.MemeDto;
import com.example.Meme.Website.dto.MemeFeedResponse;
import com.example.Meme.Website.dto.SearchResult;
import com.example.Meme.Website.models.ActionType;
import com.example.Meme.Website.models.Meme;
import com.example.Meme.Website.services.memeService;

@RestController
@RequestMapping("/memes")
public class MemeController {

    @Autowired
    private memeService memeService;

    @GetMapping("/{username}")
    public ResponseEntity<?> getUserMemes(
            @PathVariable String username,
            @RequestParam ActionType actionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            Map<String, Object> response = memeService.getUserMemes(username, actionType, page, limit);
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/memepage/{id}")
    public ResponseEntity<MemeDto> getMemeById(
            @PathVariable String id,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false, defaultValue = "false") boolean excludeComments) {

        MemeDto memeDto = memeService.getMemeById(id, userId, excludeComments);
        if (memeDto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(memeDto);
    }

    // using
    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getMemeComments(
            @PathVariable String id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return memeService.getMemeComments(id, page, limit);
    }

    @GetMapping("/search")
    public ResponseEntity<SearchResult> searchMemes(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "desc") String sort,
            @RequestParam(required = false, defaultValue = "false") boolean excludeComments) {
        return memeService.searchMemes(query, startDate, endDate, limit, page, sort, excludeComments);
    }

    @DeleteMapping("/delete/{memeId}")
    public ResponseEntity<?> deleteMeme(@PathVariable String memeId) throws Exception {
        return memeService.deleteMeme(memeId);
    }

    // using
    @GetMapping("/recomendedMemes/{memeId}/{userId}")
    public ResponseEntity<Map<String, Object>> getRecomendedMemes(
            @PathVariable String memeId,
            @PathVariable String userId,
            @RequestParam(required = false, defaultValue = "999999") double lastScore,
            @RequestParam(required = false, defaultValue = "zzzzzzzzzz") String lastId,
            @RequestParam(defaultValue = "10") int limit) {

        List<Meme> relatedMeme = memeService.findRelatedMemes(memeId, userId, lastScore, lastId, limit);

        String newLastId = relatedMeme.isEmpty() ? null : relatedMeme.get(relatedMeme.size() - 1).getId();
        double newLastScore = relatedMeme.isEmpty() ? 0 : memeService.getScoreOfMeme(newLastId);

        Map<String, Object> response = new HashMap<>();
        response.put("memes", relatedMeme);
        response.put("cursor", Map.of("lastScore", newLastScore, "lastId", newLastId));

        return ResponseEntity.ok(response);
    }

    // using
    @GetMapping("/discover")
    public ResponseEntity<MemeFeedResponse> getDiscoveredMemes(
            @RequestParam String username,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {

        int zeroBasedPage = Math.max(0, page - 1);

        MemeFeedResponse response = memeService.discoverMemes(username, zeroBasedPage, limit);
        return ResponseEntity.ok(response);
    }

    // using
    @GetMapping("/feed/main")
    public ResponseEntity<MemeFeedResponse> getMainFeed(
            @RequestParam(required = true) String userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        MemeFeedResponse feed = memeService.buildMainFeed(userId, page, limit);
        return ResponseEntity.ok(feed);
    }
}
