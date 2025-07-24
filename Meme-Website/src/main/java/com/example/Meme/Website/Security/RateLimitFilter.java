package com.example.Meme.Website.Security;

import java.io.IOException;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.example.Meme.Website.config.RateLimitConfig;
import com.example.Meme.Website.models.UserPrincipal;
import com.example.Meme.Website.services.RateLimiterService;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitFilter implements Filter {

    @Autowired private RateLimiterService rateLimiterService;
    @Autowired private RateLimitConfig rateLimitConfig;

    private static final Set<String> EXCLUDED_PATHS = Set.of(
        "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/health/check"
    );

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String path = request.getRequestURI();

        if (EXCLUDED_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = extractClientKey(request);

        String bucketType = mapPathToBucketType(path);

        if (!rateLimiterService.isAllowed(bucketType, clientKey)) {
            long retryAfter = rateLimiterService.getRetryAfter(bucketType, clientKey);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"message\": \"Too many requests to " + bucketType + ". Try again in " + retryAfter + " seconds.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String extractClientKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            Object principal = auth.getPrincipal();
            if (principal instanceof UserDetails userDetails) {
                if (userDetails instanceof UserPrincipal userPrincipal) {
                    return "user:" + userPrincipal.getUserId();
                } else {
                    return "user:" + userDetails.getUsername();
                }
            }
        }
        return "ip:" + request.getRemoteAddr();
    }

    // private String mapPathToBucketType(String path) {
    //     if (path.startsWith("/user/profile") && path.contains("update")) return "api:write";
    //     if (path.startsWith("/user/profile")) return "api:read";
    //     if (path.startsWith("/meme/upload")) return "api:upload";
    //     if (path.startsWith("/api/meme") || path.startsWith("/api/comments") || path.contains("/saved") || path.contains("/liked"))
    //         return "api:scroll";

    //     return "api:read"; // default fallback
    // }

    private String mapPathToBucketType(String path) {
    if (path.startsWith("/auth")) return "api:auth";
    if (path.startsWith("/token")) return "api:token";

    if (path.startsWith("/upload/presign-temp") || path.startsWith("/upload/meme"))
        return "api:upload";
    if (path.startsWith("/upload/profile")) return "api:write";

    if (path.startsWith("/memes/delete")) return "api:delete";
    if (path.startsWith("/memes/search") || path.startsWith("/memes/discover") || path.startsWith("/memes/feed"))
        return "api:scroll";
    if (path.startsWith("/memes/") && (path.contains("/liked") || path.contains("/saved")))
        return "api:scroll";
    if (path.startsWith("/memes/") && (path.contains("/comments") || path.contains("/memepage")))
        return "api:read";

    if (path.startsWith("/memes/")) return "api:read";

    if (path.startsWith("/profile/") && path.contains("user-memes"))
        return "api:read";
    if (path.startsWith("/profile/") && path.matches(".*/(followers|following).*"))
        return "api:read";
    if (path.startsWith("/profile/")) return "api:read";

    if (path.startsWith("/notifications") && path.contains("mark-multiple-read"))
        return "api:write";
    if (path.startsWith("/notifications")) return "api:read";

    return "api:read"; // default fallback
}

}
