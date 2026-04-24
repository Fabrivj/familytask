package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.invite.CreateInviteRequest;
import com.vertexdev.familytask.dto.invite.InvitePreviewResponse;
import com.vertexdev.familytask.dto.invite.InviteResponse;
import com.vertexdev.familytask.dto.invite.ProcessInviteRequest;
import com.vertexdev.familytask.exception.InvitationException;
import com.vertexdev.familytask.mapper.InviteMapper;
import com.vertexdev.familytask.model.FamilyActivity;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Invitation;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.ActivityAction;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyActivityRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.util.FamilyPermissions;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.InvitationRepository;
import com.vertexdev.familytask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    @Value("${app.invitation.expiration-days}")
    private int expirationDays;

    @Value("${app.invitation.base-url}")
    private String baseUrl;

    private final InvitationRepository invitationRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final FamilyActivityRepository familyActivityRepository;
    private final InviteMapper invitationMapper;
    private final UserRepository userRepository;
    private final FamilyPermissions familyPermissions;

    /**
     * Step 2 of the flow: Parent/Guardian generates the invitation.
     */
    @Transactional
    public InviteResponse createInvitation(CreateInviteRequest request, User requester) {
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new InvitationException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        // Verify that the requester is PARENT in this family
        FamilyMember requesterMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new InvitationException("ACCESS_DENIED",
                        "No tienes permisos para invitar miembros a esta familia.", 403));

        // Only admins can invite someone as admin
        boolean inviteAsAdmin = Boolean.TRUE.equals(request.getIsAdmin());
        if (inviteAsAdmin) {
            if (!Boolean.TRUE.equals(requesterMember.getIsAdmin())) {
                throw new InvitationException("ACCESS_DENIED",
                        "Solo un administrador puede invitar a otro administrador.", 403);
            }
            // Admin invitation requires role = PARENT
            if (request.getRole() != Role.PARENT) {
                throw new InvitationException("INVALID_ROLE",
                        "Solo los Padres/Tutores pueden ser administradores.", 400);
            }
        }

        // Validate that the email is not already an active member or has a pending invitation
        boolean alreadyMember = userRepository.findByEmail(request.getInvitedEmail())
                .map(existingUser -> familyMemberRepository
                        .existsByFamilyGroupIdAndUserIdAndIsActiveTrue(familyGroup.getId(), existingUser.getId()))
                .orElse(false);

        boolean hasPendingInvitation = invitationRepository
                .existsByInvitedEmailAndFamilyGroupIdAndIsUsedFalseAndExpirationDateAfter(
                        request.getInvitedEmail(), familyGroup.getId(), LocalDateTime.now()
                );

        if (alreadyMember || hasPendingInvitation) {
            throw new InvitationException("ALREADY_MEMBER_OR_PENDING",
                    "Este correo ya pertenece a la familia o tiene una invitación pendiente.", 409);
        }

        // Create the invitation
        UUID invitationCode = UUID.randomUUID();
        LocalDateTime expirationDate = LocalDateTime.now().plusDays(expirationDays);

        Invitation invitation = Invitation.builder()
                .token(invitationCode)
                .invitedEmail(request.getInvitedEmail())
                .role(request.getRole())
                .isAdmin(inviteAsAdmin)
                .familyGroup(familyGroup)
                .expirationDate(expirationDate)
                .isUsed(false)
                .createdBy(requester)
                .build();

        invitationRepository.save(invitation);

        logActivity(familyGroup, requester, null,
                ActivityAction.MEMBER_INVITED,
                "Invitación enviada a " + request.getInvitedEmail() + " como " +
                        (inviteAsAdmin ? "Administrador" : request.getRole().name()) + ".");

        log.info("Invitation created for {} in family {} (isAdmin={})",
                request.getInvitedEmail(), familyGroup.getName(), inviteAsAdmin);

        // Build the response with the link
        InviteResponse response = invitationMapper.toResponse(invitation);
        response.setInviteLink(baseUrl + "?token=" + invitationCode);
        return response;
    }

    /**
     * Public preview: returns invitation details without authentication.
     * Used by the frontend to display family/role info before the user logs in.
     */
    public InvitePreviewResponse getPreview(String tokenStr) {
        Invitation invitation = resolveActiveInvitation(tokenStr);

        String invitedByName = invitation.getCreatedBy() != null
                ? invitation.getCreatedBy().getName()
                : null;

        String displayRole = Boolean.TRUE.equals(invitation.getIsAdmin()) ? "ADMIN" : invitation.getRole().name();

        return InvitePreviewResponse.builder()
                .familyName(invitation.getFamilyGroup().getName())
                .invitedByName(invitedByName)
                .invitedEmail(invitation.getInvitedEmail())
                .role(displayRole)
                .expirationDate(invitation.getExpirationDate())
                .build();
    }

    /**
     * Step 4 of the flow: The invitee, already authenticated with Google, processes the token.
     */
    @Transactional
    public void processInvitation(ProcessInviteRequest request, User authenticatedUser) {
        Invitation invitation = resolveActiveInvitation(request.getToken());

        // Validate that the Google email matches the invitation email
        if (!invitation.getInvitedEmail().equalsIgnoreCase(authenticatedUser.getEmail())) {
            throw new InvitationException("EMAIL_MISMATCH", "Esta invitación no pertenece a tu cuenta de Google.", 403);
        }

        // Verify that user is not already an active member
        if (familyMemberRepository.existsByFamilyGroupIdAndUserIdAndIsActiveTrue(
                invitation.getFamilyGroup().getId(), authenticatedUser.getId())) {
            throw new InvitationException("ALREADY_MEMBER", "Ya eres miembro de esta familia.", 409);
        }

        // Add user as a member — reactivate existing record if previously removed, otherwise create new
        try {
            FamilyMember member = familyMemberRepository
                    .findByFamilyGroupIdAndUserId(invitation.getFamilyGroup().getId(), authenticatedUser.getId())
                    .orElse(FamilyMember.builder()
                            .familyGroup(invitation.getFamilyGroup())
                            .user(authenticatedUser)
                            .build());

            member.setRole(invitation.getRole());
            member.setIsActive(true);
            member.setIsAdmin(Boolean.TRUE.equals(invitation.getIsAdmin()));

            familyMemberRepository.save(member);

            // Mark invitation as used
            invitation.setIsUsed(true);
            invitationRepository.save(invitation);
        } catch (Exception e) {
            log.error("Failed to add user {} to family {}: {}",
                    authenticatedUser.getEmail(),
                    invitation.getFamilyGroup().getName(),
                    e.getMessage());
            throw new InvitationException("ASSOCIATION_FAILED",
                    "No se pudo completar la incorporación. Intenta de nuevo.", 500);
        }

        log.info("User {} added to family {} with role {} (isAdmin={})",
                authenticatedUser.getEmail(),
                invitation.getFamilyGroup().getName(),
                invitation.getRole(),
                invitation.getIsAdmin());
    }

    /**
     * Cancels a pending invitation. Only a PARENT of the family can cancel it.
     */
    @Transactional
    public void cancelInvitation(String tokenStr, User requester) {
        UUID tokenUUID;
        try {
            tokenUUID = UUID.fromString(tokenStr);
        } catch (IllegalArgumentException e) {
            throw new InvitationException("INVALID_TOKEN", "La invitación no es válida.", 400);
        }

        Invitation invitation = invitationRepository.findByToken(tokenUUID)
                .orElseThrow(() -> new InvitationException("NOT_FOUND", "La invitación no existe.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(invitation.getFamilyGroup().getId(), requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new InvitationException("ACCESS_DENIED",
                        "No tienes permisos para cancelar esta invitación.", 403));

        logActivity(invitation.getFamilyGroup(), requester, null,
                ActivityAction.INVITATION_CANCELLED,
                "Invitación a " + invitation.getInvitedEmail() + " cancelada.");

        invitationRepository.delete(invitation);
        log.info("Invitation for {} cancelled by {}", invitation.getInvitedEmail(), requester.getEmail());
    }

    /**
     * Parses and validates a token string, returning the active Invitation.
     * Throws INVALID_TOKEN (400) if the token is malformed, not found, already used, or expired.
     */
    private Invitation resolveActiveInvitation(String tokenStr) {
        UUID tokenUUID;
        try {
            tokenUUID = UUID.fromString(tokenStr);
        } catch (IllegalArgumentException e) {
            throw new InvitationException("INVALID_TOKEN", "La invitación no es válida o expiró.", 400);
        }

        Invitation invitation = invitationRepository.findByToken(tokenUUID)
                .orElseThrow(() -> new InvitationException("INVALID_TOKEN", "La invitación no es válida o expiró.", 400));

        if (invitation.getIsUsed()) {
            throw new InvitationException("INVALID_TOKEN", "La invitación no es válida o expiró.", 400);
        }

        if (LocalDateTime.now().isAfter(invitation.getExpirationDate())) {
            throw new InvitationException("INVALID_TOKEN", "La invitación no es válida o expiró.", 400);
        }

        return invitation;
    }

    private void logActivity(FamilyGroup familyGroup, User performedBy, User targetUser,
                              ActivityAction action, String details) {
        FamilyActivity activity = FamilyActivity.builder()
                .familyGroup(familyGroup)
                .performedBy(performedBy)
                .targetUser(targetUser)
                .action(action)
                .details(details)
                .build();
        familyActivityRepository.save(activity);
    }
}
