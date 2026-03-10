package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.invitacion.CrearInvitacionRequest;
import com.vertexdev.familytask.dto.invitacion.InvitacionResponse;
import com.vertexdev.familytask.dto.invitacion.ProcesarInvitacionRequest;
import com.vertexdev.familytask.model.Usuario;
import com.vertexdev.familytask.service.InvitacionService;
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
public class InvitacionController {

    private final InvitacionService invitacionService;

    /**
     * El Padre/Tutor genera la invitación.
     * Requiere JWT en el header Authorization.
     *
     * POST /api/invitaciones
     * Body: { "emailInvitado": "...", "rol": "HIJO", "familiaId": 1 }
     */
    @PostMapping
    public ResponseEntity<InvitacionResponse> crearInvitacion(
            @Valid @RequestBody CrearInvitacionRequest request,
            @AuthenticationPrincipal Usuario usuarioAutenticado) {

        InvitacionResponse response = invitacionService.crearInvitacion(request, usuarioAutenticado);
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
            @Valid @RequestBody ProcesarInvitacionRequest request,
            @AuthenticationPrincipal Usuario usuarioAutenticado) {

        invitacionService.procesarInvitacion(request, usuarioAutenticado);
        return ResponseEntity.ok().build();
    }
}