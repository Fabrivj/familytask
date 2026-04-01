package com.vertexdev.familytask.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class JwtUtilTest {

    @InjectMocks
    private JwtUtil jwtUtil;

    // Clave Base64 de 34 bytes (272 bits) — supera el mínimo de 256 bits para HS256
    private static final String TEST_SECRET =
            Base64.getEncoder().encodeToString("test-secret-key-for-unit-testing!".getBytes());

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 3_600_000L);
    }

    // Test 1: el token generado contiene el email y userId correctos
    @Test
    void generateToken_returnsTokenWithCorrectEmailAndUserId() {
        String token = jwtUtil.generateToken("usuario@familia.com", 7L);

        assertThat(jwtUtil.extractEmail(token)).isEqualTo("usuario@familia.com");
        assertThat(jwtUtil.extractUserId(token)).isEqualTo(7L);
        assertThat(jwtUtil.isTokenValid(token)).isTrue();
    }

    // Test 2: un token con expiración negativa se considera inválido
    @Test
    void isTokenValid_returnsFalse_whenTokenIsExpired() {
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", -1_000L);

        String expiredToken = jwtUtil.generateToken("usuario@familia.com", 7L);

        assertThat(jwtUtil.isTokenValid(expiredToken)).isFalse();
    }
}
