package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.invitacion.CreateInviteRequest;
import com.vertexdev.familytask.dto.invitacion.InviteResponse;
import com.vertexdev.familytask.dto.invitacion.ProcessInviteRequest;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitaciones")
@RequiredArgsConstructor
public class InviteController {

    private final InvitationService invitationService;

    /**
     * El Padre/Tutor genera la invitación.
     * Requiere JWT en el header Authorization.
     *
     * POST /api/invitaciones
     * Body: { "emailInvitado": "...", "rol": "HIJO", "familiaId": 1 }
     */
    @PostMapping
    public ResponseEntity<InviteResponse> crearInvitacion(
            @Valid @RequestBody CreateInviteRequest request,
            @AuthenticationPrincipal User userAutenticado) {

        InviteResponse response = invitationService.crearInvitacion(request, userAutenticado);
        return ResponseEntity.ok(response);
    }

    /**
     * El invitado, ya autenticado con Google, manda el token guardado en localStorage.
     * Requiere JWT en el header Authorization.
     *
     * POST /api/invitaciones/procesar
     * Body: { "token": "uuid-del-token" }
     */
    @PostMapping("/procesar")
    public ResponseEntity<Void> procesarInvitacion(
            @Valid @RequestBody ProcessInviteRequest request,
            @AuthenticationPrincipal User userAutenticado) {

        invitationService.procesarInvitacion(request, userAutenticado);
        return ResponseEntity.ok().build();
    }
}