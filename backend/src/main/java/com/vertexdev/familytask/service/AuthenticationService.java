package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.GoogleTokenRequest;
import com.vertexdev.familytask.dto.LoginResponse;
import com.vertexdev.familytask.model.Role;
import com.vertexdev.familytask.model.RoleEnum;
import com.vertexdev.familytask.repository.RoleRepository;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;

    @Value("${google.client-id}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;

    @PostConstruct
    public void init() {
        // Inicializa el verificador de tokens de Google
        verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    /**
     * Flujo principal de autenticación con Google.
     *
     * 1. Recibe el ID Token de Google
     * 2. Lo valida con GoogleIdTokenVerifier (verifica firma, audience, expiración)
     * 3. Extrae la información del usuario (email, nombre, foto, googleId)
     * 4. Busca el usuario en BD por googleId
     *    - Si existe: actualiza nombre, foto y lastLogin
     *    - Si no existe: crea un nuevo usuario con rol PARENT por defecto
     * 5. Genera un JWT propio del sistema
     * 6. Retorna el JWT + info del usuario
     */
    public LoginResponse authenticateWithGoogle(GoogleTokenRequest request) {
        try {
            // Paso 1: Validar el token con Google
            var parsed = GoogleIdToken.parse(GsonFactory.getDefaultInstance(), request.getToken());
            var p = parsed.getPayload();
            //log.info("Configured google.client-id={}", googleClientId);
            //log.info("TOKEN aud={}, iss={}, exp={}, email={}",
            //        p.getAudience(), p.getIssuer(), p.getExpirationTimeSeconds(), p.getEmail());
            GoogleIdToken idToken = verifier.verify(request.getToken());

            if (idToken == null) {
                throw new RuntimeException("Token de Google inválido o expirado");
            }

            // Paso 2: Extraer información del usuario desde el token
            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();           // ID único de Google
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            // Fallback si Google no devuelve nombe
            if (name == null || name.isBlank()) {
                name = email.split("@")[0];
            }
            final String userName = name;

            log.info("Google login exitoso para: {} ({})", email, userName);

            // Paso 3: Buscar o crear usuario
            User user = userRepository.findByGoogleId(googleId)
                    .map(existingUser -> {
                        // Usuario existe → actualizar datos
                        existingUser.setName(userName);
                        existingUser.setPictureUrl(pictureUrl);
                        existingUser.setLastLogin(LocalDateTime.now());
                        log.info("Usuario existente actualizado: {}", email);
                        return userRepository.save(existingUser);
                    })
                    .orElseGet(() -> {
                        // Usuario nuevo → crear con rol PARENT por defecto
                        Role parentRole = roleRepository.findByName(RoleEnum.PARENT)
                                .orElseThrow(() -> new RuntimeException(
                                        "Rol PARENT no encontrado. ¿Se ejecutó el RoleSeeder?"
                                ));

                        User newUser = User.builder()
                                .googleId(googleId)
                                .email(email)
                                .name(userName)
                                .pictureUrl(pictureUrl)
                                .role(parentRole)
                                .lastLogin(LocalDateTime.now())
                                .build();

                        log.info("Nuevo usuario creado: {} con rol PARENT", email);
                        return userRepository.save(newUser);
                    });

            // Paso 4: Generar JWT del sistema
            String jwtToken = jwtService.generateToken(user);

            // Paso 5: Construir respuesta
            return LoginResponse.builder()
                    .token(jwtToken)
                    .expiresIn(jwtService.getExpirationTime())
                    .user(LoginResponse.UserInfo.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .name(user.getName())
                            .pictureUrl(user.getPictureUrl())
                            .role(user.getRole().getName().name())
                            .build())
                    .build();

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error validando token de Google", e);
            throw new RuntimeException("Error al autenticar con Google: " + e.getMessage());
        }
    }
}
