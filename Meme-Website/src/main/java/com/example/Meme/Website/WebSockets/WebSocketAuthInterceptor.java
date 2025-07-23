package com.example.Meme.Website.WebSockets;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.example.Meme.Website.services.JWTService;
import com.example.Meme.Website.services.RedisService;
import com.example.Meme.Website.services.UserDetailsServiceImpl;
import com.example.Meme.Website.models.UserPrincipal;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    @Autowired
    private JWTService jwtService;

    @Autowired
    private RedisService redisService;

    @Autowired
    private UserDetailsServiceImpl userDetailsServiceImpl;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wshandler,
            Map<String, Object> attributes) throws Exception {
        if (!(request instanceof ServletServerHttpRequest))
            return true;

        HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
        Cookie[] cookies = servletRequest.getCookies();

        if (cookies == null) {
            attributes.put("isGuest", true);
            return true;
        }

        String accessToken = null;
        String username = null;

        for (Cookie cookie : cookies) {
            if ("access_token".equals(cookie.getName())) {
                accessToken = cookie.getValue();
            } else if ("username".equals(cookie.getName())) {
                username = cookie.getValue();
            }
        }

        boolean accessTokenValid = false;
        UserDetails userDetails = null;
        String userId = null;

        if (accessToken != null) {
            try {
                username = jwtService.extractUsernameEvenIfExpired(accessToken);
                userDetails = userDetailsServiceImpl.loadUserByUsername(username);
                userId = ((UserPrincipal) userDetails).getUserId();

                accessTokenValid = jwtService.validateToken(accessToken, userDetails);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        if (accessTokenValid && username != null) {
            if (jwtService.willExpireSoon(accessToken, 5)) {
                String newAccessToken = jwtService.generateToken(username, 15, "access_token");
                attributes.put("access_token", newAccessToken);
            } else {
                attributes.put("access_token", accessToken);
            }

            attributes.put("username", username);
            if (userDetails != null) {
                attributes.put("userId", userId);
            }
            return true;
        }

        if (!accessTokenValid && username != null) {
            try {
                userDetails = userDetailsServiceImpl.loadUserByUsername(username);
                String refreshToken = redisService.getToken("refresh_token", username);

                if (refreshToken != null && jwtService.validateToken(refreshToken, userDetails)) {
                    String newAccessToken = jwtService.generateToken(username, 15, "access_token");

                    if (userDetails instanceof UserPrincipal) {
                        userId = ((UserPrincipal) userDetails).getUserId();
                    }

                    attributes.put("access_token", newAccessToken);
                    attributes.put("username", username);
                    attributes.put("userId", userId);

                    if (jwtService.willExpireSoon(refreshToken, 60 * 24)) {
                        String newRefreshToken = jwtService.generateToken(username, 60 * 24 * 7, "refresh_token");
                        redisService.setToken("refresh_token", username, newRefreshToken, 60 * 24 * 7 * 60);
                    }

                    return true;
                } else {
                    redisService.deleteToken("refresh_token", username);
                    return false;
                }
            } catch (Exception e) {
            }
        }

        attributes.put("isGuest", true);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // No-op
    }
}
