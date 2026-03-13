package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.auth.AuthResponse;
import com.vertexdev.familytask.dto.auth.GoogleCallbackRequest;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google/callback")
    public ResponseEntity<AuthResponse> googleCallback(@Valid @RequestBody GoogleCallbackRequest request) {
        return ResponseEntity.ok(authService.processGoogleCallback(request.getCode()));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getMe(user));
    }
}