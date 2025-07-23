package com.example.Meme.Website.services;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.Meme.Website.Security.CookieUtil;
import com.example.Meme.Website.dto.AuthRequest;
import com.example.Meme.Website.dto.AuthResponse;
import com.example.Meme.Website.dto.PasswordResetRequest;
import com.example.Meme.Website.dto.RegisterResponse;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AuthService {
    @Autowired
    private userRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JWTService jwtservice;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private RedisService redisService;

    @Autowired
    private ApplicationContext context;

    @Autowired
    private CookieUtil cookieUtil;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Transactional
    public ResponseEntity<RegisterResponse> registerUser(userModel user) {
        try {
            String rawUsername = user.getUsername() != null ? user.getUsername().trim() : "";
            String rawEmail = user.getEmail() != null ? user.getEmail().trim() : "";

            log.info("Attempting to register user with username: '{}'", rawUsername);

            if (rawUsername.isEmpty() || rawEmail.isEmpty() || user.getPassword() == null
                    || user.getPassword().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new RegisterResponse("Username, Email, and Password must not be empty", null, null,
                                null));
            }

            boolean usernameExists = userRepository.existsByUsername(rawUsername);
            boolean emailExists = userRepository.existsByEmail(rawEmail);

            if (usernameExists || emailExists) {
                String errorMessage;
                if (usernameExists && emailExists)
                    errorMessage = "Username and Email already exist";
                else if (usernameExists)
                    errorMessage = "Username already exists";
                else
                    errorMessage = "Email already exists";

                log.warn("Registration failed for '{}': {}", rawUsername, errorMessage);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new RegisterResponse(errorMessage, null, null, null));
            }

            user.setUsername(rawUsername);
            user.setEmail(rawEmail);
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            Date now = new Date();
            user.setUserCreated(now);
            user.setUserUpdated(now);
            user.setTagInteractions(new HashMap<>());

            user.setProfilePictureUrl("");
            user.setProfileBannerUrl("");
            user.setFollowersCount(0L);
            user.setFollowingCount(0L);
            user.setUploadCount(0L);
 
            userModel savedUser = userRepository.save(user);

            long accessTokenExpiryMinutes = 1;
            long refreshTokenExpiryMinutes = 60 * 24 * 7;

            String accessToken = jwtservice.generateToken(savedUser.getUsername(), accessTokenExpiryMinutes,
                    "accessToken");
            String refreshToken = jwtservice.generateToken(savedUser.getUsername(), refreshTokenExpiryMinutes,
                    "refreshToken");

            redisService.setToken("refresh_token", savedUser.getUsername(), refreshToken,
                    refreshTokenExpiryMinutes * 60);

            log.info("✅ User '{}' registered successfully", savedUser.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new RegisterResponse(savedUser.getUsername(), accessToken, refreshToken,
                            savedUser.getUserId()));

        } catch (Exception e) {
            log.error("❌ Registration error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new RegisterResponse("Registration failed! Please try again later.", null, null, null));
        }
    }

    @Transactional
    public AuthResponse authenticate(AuthRequest request) {
        final String username = request.getUsername();
        final String rawPassword = request.getPassword();

        log.info("🔐 Authentication attempt for username: '{}'", username);

        userModel user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("❌ Authentication failed: User '{}' not found", username);
                    return new UsernameNotFoundException("User not found");
                });

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            log.warn("❌ Authentication failed: Invalid password for username '{}'", username);
            throw new BadCredentialsException("Invalid username or password");
        }

        final long accessTokenExpiryMin = 1;
        final long refreshTokenExpiryMin = request.isRememberMe() ? 60 * 24 * 7 : 60 * 24; // 7 days vs 1 day

        String accessToken = jwtservice.generateToken(username, accessTokenExpiryMin, "accessToken");
        String refreshToken = jwtservice.generateToken(username, refreshTokenExpiryMin, "refreshToken");

        redisService.setToken("refresh_token", username, refreshToken, refreshTokenExpiryMin * 60);

        log.info("✅ Authentication successful for username: '{}'", username);

        return new AuthResponse(accessToken, refreshToken, user.getUsername(), user.getUserId());
    }

    @Transactional
    public ResponseEntity<?> forgotPassword(Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            log.warn("❌ Password reset request failed: Missing email");
            return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("message", "Email is required"));
        }

        log.info("🔐 Password reset request received for email: {}", email);

        Optional<userModel> userOptional = userRepository.findByEmail(email.trim());

        if (userOptional.isEmpty()) {
            log.warn("❌ User not found for email: {}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "User not found"));
        }

        userModel user = userOptional.get();
        String username = user.getUsername();

        String resetToken = jwtservice.generateToken(username, 15, "password_reset_token"); // 15-min expiry
        String resetId = UUID.randomUUID().toString();

        redisService.setToken("reset", resetId, resetToken, 15 * 60);

        log.info("✅ Reset token generated and stored in Redis for user: {}", username);

        String resetLink = frontendUrl + "/reset-password/" + resetId;
        String emailBody = String.format("""
                Click the link below to reset your password:
                %s

                This link will expire in 15 minutes.
                """, resetLink);

        emailService.sendEmail(
                user.getEmail(),
                "Password Reset Request",
                emailBody);

        log.info("📧 Password reset email sent to: {}", user.getEmail());

        return ResponseEntity.ok(Collections.singletonMap("message", "Password reset link sent!"));
    }

    @Transactional
    public ResponseEntity<?> resetPassword(PasswordResetRequest request) {
        String resetId = request.getResetId();
        String newPassword = request.getNewPassword();

        if (resetId == null || newPassword == null || newPassword.trim().isEmpty()) {
            log.warn("❌ Password reset failed: Invalid request payload");
            return ResponseEntity.badRequest().body("Reset ID and new password are required");
        }

        log.info("🔐 Received password reset request for resetId: {}", resetId);

        String token = redisService.getToken("reset", resetId);
        if (token == null) {
            log.warn("❌ No token found in Redis for resetId: {}", resetId);
            return ResponseEntity.badRequest().body("Invalid or expired reset link");
        }

        String username;
        try {
            username = jwtservice.extractUserName(token);
        } catch (Exception e) {
            log.error("❌ Failed to extract username from token for resetId {}: {}", resetId, e.getMessage());
            return ResponseEntity.badRequest().body("Invalid token format");
        }

        log.info("✅ Extracted username '{}' from token", username);

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtservice.validateToken(token, userDetails)) {
            log.warn("❌ Token validation failed for user '{}'", username);
            return ResponseEntity.badRequest().body("Invalid or expired token");
        }

        userModel user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("❌ User not found in database: {}", username);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
                });

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            log.warn("⚠️ User '{}' tried resetting to the current password", username);
            return ResponseEntity.badRequest().body("New password cannot be same as old password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        redisService.deleteToken("reset", resetId);

        log.info("✅ Password reset successful for user: {}", username);

        return ResponseEntity.ok("Password reset successful");
    }

    public void refreshAccessToken(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String accessToken = jwtservice.extractTokenFromCookies(request);
        String username = null;

        try {
            if (accessToken != null) {
                username = jwtservice.extractUserName(accessToken);
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to extract username from access token: {}", e.getMessage());
        }

        if (username == null) {
            username = jwtservice.extractUsernameFromCookie(request);
            if (username == null) {
                log.error("❌ No username found in either token or cookie.");
                throw new Exception("No username available to refresh access token.");
            }
        }

        UserDetails userDetails = context.getBean(UserDetailsServiceImpl.class).loadUserByUsername(username);
        String storedRefreshToken = redisService.getToken("refresh_token", username);

        if (storedRefreshToken == null) {
            log.warn("⚠️ No refresh token found for user: {}", username);
            throw new Exception("Refresh token missing or expired.");
        }

        if (!jwtservice.validateToken(storedRefreshToken, userDetails)) {
            redisService.deleteToken("refresh_token", username);
            log.warn("❌ Invalid or expired refresh token for user: {}", username);
            throw new Exception("Refresh token invalid or expired.");
        }

        String newAccessToken = jwtservice.generateToken(username, 60, "access_token"); // 1 hour
        cookieUtil.addCookie(response, "access_token", newAccessToken, 60);
        log.info("✅ Issued new access token for user: {}", username);

        if (jwtservice.willExpireSoon(storedRefreshToken, 10)) {
            String newRefreshToken = jwtservice.generateToken(username, 60 * 24 * 7, "refresh_token"); // 7 days
            redisService.setToken("refresh_token", username, newRefreshToken, 60 * 24 * 7 * 60); // 7 days in seconds
            log.info("🔁 Rotated refresh token for user: {}", username);
        }

        cookieUtil.addCookie(response, "username", username, 60 * 60 * 24 * 7); // 7 days
    }

}
