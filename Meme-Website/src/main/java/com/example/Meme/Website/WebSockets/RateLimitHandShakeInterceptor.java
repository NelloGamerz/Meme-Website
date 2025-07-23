package com.example.Meme.Website.WebSockets;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.example.Meme.Website.services.RateLimiterService;

@Component
public class RateLimitHandShakeInterceptor implements HandshakeInterceptor {

    @Autowired
    private RateLimiterService rateLimiter;


    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler handler, Map<String, Object> attributes) {

        String clientKey = attributes.containsKey("userId")
                ? "user:" + attributes.get("userId")
                : "ip:" + request.getRemoteAddress().getAddress().getHostAddress();

        String bucketType = "ws:session";

        if (!rateLimiter.isAllowed(bucketType, clientKey)) {
            long retryAfter = rateLimiter.getRetryAfter(bucketType, clientKey);
            response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            response.getHeaders().add("Retry-After", String.valueOf(retryAfter));
            return false;
        }

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
