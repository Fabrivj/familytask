package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.invite.CreateInviteRequest;
import com.vertexdev.familytask.dto.invite.InviteResponse;
import com.vertexdev.familytask.dto.invite.ProcessInviteRequest;
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
     * The Parent/Guardian generates the invitation.
     * Requires JWT in the Authorization header.
     *
     * POST /api/invitaciones
     * Body: { "invitedEmail": "...", "role": "MEMBER", "familyId": 1 }
     */
    @PostMapping
    public ResponseEntity<InviteResponse> createInvitation(
            @Valid @RequestBody CreateInviteRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        InviteResponse response = invitationService.createInvitation(request, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    /**
     * The invited user, already authenticated with Google, sends the token stored in localStorage.
     * Requires JWT in the Authorization header.
     *
     * POST /api/invitaciones/procesar
     * Body: { "token": "uuid-token-value" }
     */
    @PostMapping("/procesar")
    public ResponseEntity<Void> processInvitation(
            @Valid @RequestBody ProcessInviteRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        invitationService.processInvitation(request, authenticatedUser);
        return ResponseEntity.ok().build();
    }
}