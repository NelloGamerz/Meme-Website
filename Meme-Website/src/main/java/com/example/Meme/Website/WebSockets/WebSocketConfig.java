package com.example.Meme.Website.WebSockets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.example.Meme.Website.config.RateLimitConfig;
import com.example.Meme.Website.services.ProfileService;
import com.example.Meme.Website.services.RateLimiterService;
import com.example.Meme.Website.services.memeService;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer{

    @Autowired
    private WebSocketAuthInterceptor webSocketAuthInterceptor;
    @Autowired
    private RateLimitHandShakeInterceptor rateLimitHandshakeInterceptor;

    @Autowired
    private memeService memeService;
    @Autowired
    private ProfileService profileService;
    @Autowired
    private WebSocketSessionManager webSocketSessionManager;
    @Autowired
    private RateLimiterService rateLimiterService;
    @Autowired
    private RateLimitConfig rateLimitConfig;

    @Value("${frontend.websocket.url}")
    private String frontendUrl;
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry){
        registry.addHandler(webSocketHandler() , "/ws")
        .setAllowedOrigins(frontendUrl)
        .addInterceptors(webSocketAuthInterceptor, rateLimitHandshakeInterceptor);
    }

    public WebSocketHandler webSocketHandler(){
        return new CustomWebSocketHandler(memeService, profileService, webSocketSessionManager, rateLimiterService, rateLimitConfig);
    }
}
