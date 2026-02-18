package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.GoogleTokenRequest;
import com.vertexdev.familytask.dto.LoginResponse;
import com.vertexdev.familytask.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    /**
     * POST /auth/google-login
     *
     * Recibe un Google ID Token, lo valida, crea/actualiza el usuario
     * y retorna un JWT propio del sistema.
     *
     */
    @PostMapping("/google-login")
    public ResponseEntity<LoginResponse> googleLogin(
            @Valid @RequestBody GoogleTokenRequest request
    ) {
        LoginResponse response = authenticationService.authenticateWithGoogle(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /auth/health
     * Un Healthcheck.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("FamilyTask API is running!");
    }
}
