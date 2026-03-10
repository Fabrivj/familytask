package com.vertexdev.familytask.service;

import com.vertexdev.familytask.config.JwtUtil;
import com.vertexdev.familytask.dto.auth.AuthResponse;
import com.vertexdev.familytask.model.Usuario;
import com.vertexdev.familytask.repository.FamiliaMiembroRepository;
import com.vertexdev.familytask.repository.UsuarioRepository;
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
    private final UsuarioRepository usuarioRepository;
    private final FamiliaMiembroRepository familiaMiembroRepository;
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
            throw new RuntimeException("No se pudo obtener el correo desde Google");
        }

        Usuario usuario = usuarioRepository.findByEmail(email).orElseGet(() -> {
            log.info("Nuevo usuario registrado: {}", email);
            return usuarioRepository.save(
                    Usuario.builder()
                            .googleId(googleId)
                            .email(email)
                            .nombre(nombre)
                            .fotoPerfil(foto)
                            .build()
            );
        });

        if (!googleId.equals(usuario.getGoogleId())) {
            usuario.setGoogleId(googleId);
            usuarioRepository.save(usuario);
        }

        String jwt = jwtUtil.generateToken(usuario.getEmail(), usuario.getId());

        return buildAuthResponse(usuario, jwt);
    }

    public AuthResponse getMe(Usuario usuario) {
        return buildAuthResponse(usuario, null);
    }

    private AuthResponse buildAuthResponse(Usuario usuario, String token) {
        List<AuthResponse.FamiliaResumen> familias = familiaMiembroRepository
                .findByUsuarioIdAndActivoTrue(usuario.getId())
                .stream()
                .map(m -> AuthResponse.FamiliaResumen.builder()
                        .familiaId(m.getFamilia().getId())
                        .familiaNombre(m.getFamilia().getNombre())
                        .rol(m.getRol().name())
                        .build())
                .toList();

        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .fotoPerfil(usuario.getFotoPerfil())
                .familias(familias)
                .build();
    }
}