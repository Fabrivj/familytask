package com.vertexdev.familytask.service;

import com.vertexdev.familytask.config.JwtUtil;
import com.vertexdev.familytask.dto.auth.AuthResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private GoogleAuthService googleAuthService;
    @Mock private UserRepository userRepository;
    @Mock private FamilyMemberRepository familyMemberRepository;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    // Test 3: cuando el email no existe en BD, se crea el usuario y se retorna el token
    @Test
    void processGoogleCallback_createsNewUser_whenEmailIsNew() {
        when(googleAuthService.exchangeCodeForAccessToken("auth-code")).thenReturn("access-token");
        when(googleAuthService.getUserInfo("access-token")).thenReturn(Map.of(
                "id",      "google-123",
                "email",   "nuevo@familia.com",
                "name",    "Usuario Nuevo",
                "picture", "https://foto.url"
        ));
        when(userRepository.findByEmail("nuevo@familia.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u = User.builder()
                    .id(1L)
                    .googleId(u.getGoogleId())
                    .email(u.getEmail())
                    .name(u.getName())
                    .pictureUrl(u.getPictureUrl())
                    .build();
            return u;
        });
        when(familyMemberRepository.findByUserIdAndIsActiveTrue(1L)).thenReturn(List.of());
        when(jwtUtil.generateToken("nuevo@familia.com", 1L)).thenReturn("jwt-token");

        AuthResponse response = authService.processGoogleCallback("auth-code");

        assertThat(response.getEmail()).isEqualTo("nuevo@familia.com");
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getFamilies()).isEmpty();
        verify(userRepository).save(any(User.class));
    }
}
