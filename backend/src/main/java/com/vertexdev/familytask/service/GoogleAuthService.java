package com.vertexdev.familytask.service;

import com.vertexdev.familytask.exception.AuthException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    @Value("${app.google.client-id}")
    private String clientId;

    @Value("${app.google.client-secret}")
    private String clientSecret;

    @Value("${app.google.redirect-uri}")
    private String redirectUri;

    @Value("${app.google.token-endpoint}")
    private String tokenEndpoint;

    @Value("${app.google.userinfo-endpoint}")
    private String userinfoEndpoint;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Intercambia el authorization code con Google y retorna el access_token.
     */
    public String exchangeCodeForAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("redirect_uri", redirectUri);
        body.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenEndpoint, request, Map.class);

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new AuthException("INVALID_TOKEN", "Error al obtener el token de Google");
        }

        return (String) response.getBody().get("access_token");
    }

    /**
     * Usa el access_token para obtener el perfil del usuario desde Google.
     * Retorna un Map con: id, email, name, picture
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                userinfoEndpoint,
                HttpMethod.GET,
                request,
                Map.class
        );

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new AuthException("INVALID_TOKEN", "No se pudo obtener el perfil de Google");
        }

        return response.getBody();
    }
}