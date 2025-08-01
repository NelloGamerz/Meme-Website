package com.example.Meme.Website.Security;

import com.example.Meme.Website.services.JWTService;
import com.example.Meme.Website.services.RedisService;
import com.example.Meme.Website.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JWTService jwtService;

    @Autowired
    ApplicationContext context;

    @Autowired
    private CookieUtil cookieUtil;

    @Autowired
    private RedisService redisService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.equals("/api/token/refresh")) {
            filterChain.doFilter(request, response);
            return;
        }

        if(path .equals("/health/check")){
            filterChain.doFilter(request,response);
            return;
        }

        String accessToken = jwtService.extractTokenFromCookies(request);
        String username = null;
        UserDetails userDetails = null;
        boolean accessTokenValid = false;

        if (accessToken != null) {
            try {
                username = jwtService.extractUsernameEvenIfExpired(accessToken);
                userDetails = context.getBean(UserDetailsServiceImpl.class).loadUserByUsername(username);
                accessTokenValid = jwtService.validateToken(accessToken, userDetails);
            } catch (Exception e) {
            }
        }

        if (accessTokenValid && username != null) {
            if (jwtService.willExpireSoon(accessToken, 5)) {
                String newAccessToken = jwtService.generateToken(username, 15, "access_token");
                cookieUtil.addCookie(response, "access_token", newAccessToken, 15);
            }

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);

        } else {
            if (username == null) {
                username = jwtService.extractUsernameFromCookie(request);
            }

            if (username != null) {
                try {
                    userDetails = context.getBean(UserDetailsServiceImpl.class).loadUserByUsername(username);
                    String storedRefreshToken = redisService.getToken("refresh_token", username);

                    boolean refreshTokenValid = storedRefreshToken != null &&
                            jwtService.validateToken(storedRefreshToken, userDetails);

                    if (refreshTokenValid) {

                        String newAccessToken = jwtService.generateToken(username, 15, "access_token");
                        cookieUtil.addCookie(response, "access_token", newAccessToken, 15);

                        if (jwtService.willExpireSoon(storedRefreshToken, 60 * 24)) {
                            String newRefreshToken = jwtService.generateToken(username, 60 * 24 * 7, "refresh_token");
                            redisService.setToken("refresh_token", username, newRefreshToken, 60 * 24 * 7 * 60);
                        }

                        cookieUtil.addCookie(response, "username", username, 60 * 60 * 24 * 7);

                    } else {
                        redisService.deleteToken("refresh_token", username);

                        String newAccessToken = jwtService.generateToken(username, 15, "access_token");
                        String newRefreshToken = jwtService.generateToken(username, 60 * 24 * 7, "refresh_token");

                        redisService.setToken("refresh_token", username, newRefreshToken, 60 * 24 * 7 * 60);

                        cookieUtil.addCookie(response, "access_token", newAccessToken, 15);
                        cookieUtil.addCookie(response, "username", username, 60 * 60 * 24 * 7);

                    }

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                } catch (Exception e) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            } else {
                System.out.println("[JWT Filter] User not authenticated. No username found.");
            }
        }

        filterChain.doFilter(request, response);
    }

}