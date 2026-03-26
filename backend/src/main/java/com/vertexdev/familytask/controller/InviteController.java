package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.invite.CreateInviteRequest;
import com.vertexdev.familytask.dto.invite.InvitePreviewResponse;
import com.vertexdev.familytask.dto.invite.InviteResponse;
import com.vertexdev.familytask.dto.invite.ProcessInviteRequest;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InviteController {

    private final InvitationService invitationService;

    /**
     * Public endpoint: returns invitation details (family name, role, email) without requiring auth.
     * Used by the frontend to display invitation info before the user logs in.
     *
     * GET /api/invitations/preview?token=<uuid>
     */
    @GetMapping("/preview")
    public ResponseEntity<InvitePreviewResponse> previewInvitation(@RequestParam String token) {
        return ResponseEntity.ok(invitationService.getPreview(token));
    }

    /**
     * The Parent/Guardian generates the invitation.
     * Requires JWT in the Authorization header.
     *
     * POST /api/invitations
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
     * POST /api/invitations/process
     * Body: { "token": "uuid-token-value" }
     */
    @PostMapping("/process")
    public ResponseEntity<MessageResponse> processInvitation(
            @Valid @RequestBody ProcessInviteRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        invitationService.processInvitation(request, authenticatedUser);
        return ResponseEntity.ok(new MessageResponse("Te has unido a la familia exitosamente."));
    }

    /**
     * Cancels a pending invitation. Only a PARENT of the family can cancel it.
     *
     * DELETE /api/invitations/{token}
     */
    @DeleteMapping("/{token}")
    public ResponseEntity<MessageResponse> cancelInvitation(
            @PathVariable String token,
            @AuthenticationPrincipal User authenticatedUser) {

        invitationService.cancelInvitation(token, authenticatedUser);
        return ResponseEntity.ok(new MessageResponse("Invitación cancelada exitosamente."));
    }
}