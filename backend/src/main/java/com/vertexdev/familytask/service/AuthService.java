package com.vertexdev.familytask.service;

import com.vertexdev.familytask.config.JwtUtil;
import com.vertexdev.familytask.dto.auth.AuthResponse;
import com.vertexdev.familytask.exception.AuthException;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final GoogleAuthService googleAuthService;
    private final UserRepository userRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final JwtUtil jwtUtil;

    /**
     * Receives the authorization code from Google, exchanges it for the user profile,
     * creates or retrieves the user in the DB, and returns a JWT with family summary.
     */
    @Transactional
    public AuthResponse processGoogleCallback(String code) {
        String accessToken = googleAuthService.exchangeCodeForAccessToken(code);
        Map<String, Object> googleUser = googleAuthService.getUserInfo(accessToken);

        String googleId = (String) googleUser.get("id");
        String email    = (String) googleUser.get("email");
        String name     = (String) googleUser.get("name");
        String picture  = (String) googleUser.get("picture");

        if (email == null) {
            throw new AuthException("EMAIL_NOT_FOUND", "No se pudo obtener tu correo. Reintenta el inicio de sesión.");
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            log.info("New user registered: {}", email);
            return userRepository.save(
                    User.builder()
                            .googleId(googleId)
                            .email(email)
                            .name(name)
                            .pictureUrl(picture)
                            .build()
            );
        });

        if (!googleId.equals(user.getGoogleId())) {
            user.setGoogleId(googleId);
            userRepository.save(user);
        }

        String jwtToken = jwtUtil.generateToken(user.getEmail(), user.getId());

        return buildAuthResponse(user, jwtToken);
    }

    public AuthResponse getMe(User user) {
        return buildAuthResponse(user, null);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        List<AuthResponse.FamilySummary> families = familyMemberRepository
                .findByUserIdAndIsActiveTrue(user.getId())
                .stream()
                .map(m -> AuthResponse.FamilySummary.builder()
                        .familyId(m.getFamilyGroup().getId())
                        .familyName(m.getFamilyGroup().getName())
                        .role(m.getRole().name())
                        .build())
                .toList();

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .pictureUrl(user.getPictureUrl())
                . families(families)
                .build();
    }
}