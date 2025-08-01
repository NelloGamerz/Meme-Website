package com.example.Meme.Website.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/health")
@Slf4j
public class HealthCheck {
    
    @GetMapping("/check")
    public ResponseEntity<String> healthCheck() {
        log.info("Health check endpoint called");
        return ResponseEntity.ok("Server is up and running");
    }
}
