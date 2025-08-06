package com.example.Meme.Website.controller;

import java.util.Collections;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Meme.Website.Security.CookieUtil;
import com.example.Meme.Website.dto.AuthRequest;
import com.example.Meme.Website.dto.AuthResponse;
import com.example.Meme.Website.dto.PasswordResetRequest;
import com.example.Meme.Website.dto.RegisterResponse;
import com.example.Meme.Website.models.UserPrincipal;
import com.example.Meme.Website.models.userModel;
import com.example.Meme.Website.repository.userRepository;
import com.example.Meme.Website.services.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private userRepository userRepository;

    @Autowired
    private CookieUtil cookieUtil;


    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody userModel user, HttpServletResponse response) {
        ResponseEntity<RegisterResponse> result = authService.registerUser(user);

        RegisterResponse responseBody = result.getBody();

        if (result.getStatusCode() == HttpStatus.CREATED && responseBody != null) {
            cookieUtil.addCookie(response, "access_token", responseBody.getToken(), 60);
            cookieUtil.addCookie(response, "username", user.getUsername(), 60 * 60 * 24 * 30);
        }

        return ResponseEntity.ok(Map.of("username", result.getBody().getUsername()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.authenticate(request);

        cookieUtil.addCookie(response, "access_token", authResponse.getToken(), 5 * 60);
        cookieUtil.addCookie(response, "username", authResponse.getUsername(), 60 * 60 * 24 * 30);

        return ResponseEntity.ok(Map.of(
                "username", authResponse.getUsername()));

    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequest request) {
        return authService.resetPassword(request);
    }



    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request,
            @AuthenticationPrincipal UserPrincipal user){
                return ResponseEntity.ok(Map.of("username", user.getUsername()));
            }

    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsernameAvailability(@RequestParam String username) {
        boolean available = !userRepository.existsByUsername(username);
        return ResponseEntity.ok(Collections.singletonMap("available", available));
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmailAvalability(@RequestParam String email) {
        boolean available = !userRepository.existsByEmail(email);
        return ResponseEntity.ok(Collections.singletonMap("available", available));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        cookieUtil.deleteCookie(response, "access_token");

        return ResponseEntity.ok("Logged Out Successfully");
    }

}
