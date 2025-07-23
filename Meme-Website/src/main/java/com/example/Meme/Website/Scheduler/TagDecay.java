package com.example.Meme.Website.Scheduler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.Meme.Website.models.userModel;

import com.example.Meme.Website.repository.userRepository;

@Component
public class TagDecay {

    @Autowired
    private userRepository userRepository;

    @Scheduled(cron = "0 0 3 * * ?")
    public void applyTagDecayToAllUsers() {
        List<userModel> allUsers = userRepository.findAll();
        for (userModel user : allUsers) {
            Map<String, Integer> map = Optional.ofNullable(user.getTagInteractions()).orElse(new HashMap<>());
            Map<String, Integer> decayed = new HashMap<>();
            map.forEach((tag, score) -> {
                int decayedScore = (int) Math.floor(score * 0.90);
                if (decayedScore >= 1)
                    decayed.put(tag, decayedScore);
            });
            user.setTagInteractions(decayed);
            userRepository.save(user);
        }
    }
}
