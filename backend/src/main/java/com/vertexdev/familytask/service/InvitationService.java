package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.invite.CreateInviteRequest;
import com.vertexdev.familytask.dto.invite.InviteResponse;
import com.vertexdev.familytask.dto.invite.ProcessInviteRequest;
import com.vertexdev.familytask.mapper.InviteMapper;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Invitation;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
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
    private final InviteMapper invitationMapper;
    private final UserRepository userRepository;

    /**
     * Step 2 of the flow: Parent/Guardian generates the invitation.
     */
    @Transactional
    public InviteResponse createInvitation(CreateInviteRequest request, User requester) {
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new RuntimeException("Familia no encontrada"));

        // Verify that the requester is PARENT in this family
        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), requester.getId())
                .filter(m -> m.getRole() == Role.PARENT && m.getIsActive())
                .orElseThrow(() -> new RuntimeException("No tienes permisos para invitar miembros a esta familia"));

        // Validate that the email is not already an active member or has a pending invitation
        boolean alreadyMember = userRepository.findByEmail(request.getInvitedEmail())
                .map(existingUser -> familyMemberRepository
                        .existsByFamilyGroupIdAndUserId(familyGroup.getId(), existingUser.getId()))
                .orElse(false);

        if (alreadyMember) {
            throw new RuntimeException(
                    "Este correo ya es miembro activo de esta familia.");
        }


        boolean hasPendingInvitation = invitationRepository
                .existsByInvitedEmailAndFamilyGroupIdAndIsUsedFalseAndExpirationDateAfter(
                        request.getInvitedEmail(), familyGroup.getId(), LocalDateTime.now()
                );

        if (alreadyMember || hasPendingInvitation) {
            throw new RuntimeException("Este correo ya tiene una invitación pendiente para esta familia.");
        }

        // Create the invitation
        UUID invitationCode = UUID.randomUUID();
        LocalDateTime expirationDate = LocalDateTime.now().plusDays(expirationDays);

        Invitation invitation = Invitation.builder()
                .token(invitationCode)
                .invitedEmail(request.getInvitedEmail())
                .role(request.getRole())
                .familyGroup(familyGroup)
                .expirationDate(expirationDate)
                .isUsed(false)
                .build();

        invitationRepository.save(invitation);
        log.info("Invitation created for {} in family {}", request.getInvitedEmail(), familyGroup.getName());

        // Build the response with the link
        InviteResponse response = invitationMapper.toResponse(invitation);
        response.setInviteLink(baseUrl + "?token=" + invitationCode);
        return response;
    }

    /**
     * Step 4 of the flow: The invitee, already authenticated with Google, processes the token.
     */
    @Transactional
    public void processInvitation(ProcessInviteRequest request, User authenticatedUser) {
        UUID tokenUUID;
        try {
            tokenUUID = UUID.fromString(request.getToken());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("La invitación no es válida o expiró");
        }

        Invitation invitation = invitationRepository.findByToken(tokenUUID)
                .orElseThrow(() -> new RuntimeException("La invitación no es válida o expiró"));

        // Validate that it hasn't been used
        if (invitation.getIsUsed()) {
            throw new RuntimeException("La invitación no es válida o expiró");
        }

        // Validate that it hasn't expired
        if (LocalDateTime.now().isAfter(invitation.getExpirationDate())) {
            throw new RuntimeException("La invitación no es válida o expiró");
        }

        // Validate that the Google email matches the invitation email
        if (!invitation.getInvitedEmail().equalsIgnoreCase(authenticatedUser.getEmail())) {
            throw new RuntimeException("Esta invitación no pertenece a tu cuenta de Google");
        }

        // Verify that user is not already a member
        if (familyMemberRepository.existsByFamilyGroupIdAndUserId(
                invitation.getFamilyGroup().getId(), authenticatedUser.getId())) {
            throw new RuntimeException("Ya eres miembro de esta familia");
        }

        // Add user as a member of the family with the invitation role
        FamilyMember newMember = FamilyMember.builder()
                .familyGroup(invitation.getFamilyGroup())
                .user(authenticatedUser)
                .role(invitation.getRole())
                .isActive(true)
                .build();

        familyMemberRepository.save(newMember);

        // Mark invitation as used
        invitation.setIsUsed(true);
        invitationRepository.save(invitation);

        log.info("User {} added to family {} with role {}",
                authenticatedUser.getEmail(),
                invitation.getFamilyGroup().getName(),
                invitation.getRole());
    }
}