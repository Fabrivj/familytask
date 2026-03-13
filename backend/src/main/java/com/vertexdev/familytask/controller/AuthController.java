package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.auth.AuthResponse;
import com.vertexdev.familytask.dto.auth.GoogleCallbackRequest;
import com.vertexdev.familytask.dto.auth.LogoutResponse;
import com.vertexdev.familytask.exception.AuthException;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.AuthService;
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
    public ResponseEntity<AuthResponse> googleCallback(@RequestBody GoogleCallbackRequest request) {
        if ("access_denied".equals(request.getError())) {
            throw new AuthException("LOGIN_CANCELLED", "Inicio de sesión cancelado.");
        }
        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new AuthException("INVALID_TOKEN", "No se pudo validar tu sesión con Google. Intenta de nuevo.");
        }
        return ResponseEntity.ok(authService.processGoogleCallback(request.getCode()));
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout() {
        return ResponseEntity.ok(new LogoutResponse("Sesión cerrada exitosamente."));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getMe(user));
    }
}