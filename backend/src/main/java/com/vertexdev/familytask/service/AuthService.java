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
     * Recibe el authorization code de Google, lo intercambia por el perfil del usuario,
     * crea o recupera el usuario en la DB, y retorna un JWT junto con el resumen de familias.
     */
    @Transactional
    public AuthResponse procesarGoogleCallback(String code) {
        String accessToken = googleAuthService.exchangeCodeForAccessToken(code);
        Map<String, Object> googleUser = googleAuthService.getUserInfo(accessToken);

        String googleId = (String) googleUser.get("id");
        String email    = (String) googleUser.get("email");
        String nombre   = (String) googleUser.get("name");
        String foto     = (String) googleUser.get("picture");

        if (email == null) {
            throw new AuthException("EMAIL_NOT_FOUND", "No se pudo obtener el correo desde Google");
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            log.info("Nuevo usuario registrado: {}", email);
            return userRepository.save(
                    User.builder()
                            .googleId(googleId)
                            .email(email)
                            .name(nombre)
                            .pictureUrl(foto)
                            .build()
            );
        });

        if (!googleId.equals(user.getGoogleId())) {
            user.setGoogleId(googleId);
            userRepository.save(user);
        }

        String jwt = jwtUtil.generateToken(user.getEmail(), user.getId());

        return buildAuthResponse(user, jwt);
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
                        .familyName(m.getFamilyGroup().getNombre())
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