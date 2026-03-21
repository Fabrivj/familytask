package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.family.CreateFamilyRequest;
import com.vertexdev.familytask.dto.family.FamilyMembersResponse;
import com.vertexdev.familytask.dto.family.FamilyResponse;
import com.vertexdev.familytask.dto.family.MemberItemResponse;
import com.vertexdev.familytask.dto.family.PendingInvitationResponse;
import com.vertexdev.familytask.dto.family.UpdateRoleRequest;
import com.vertexdev.familytask.exception.FamilyException;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Invitation;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.InvitationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FamilyGroupService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final InvitationRepository invitationRepository;

    @Transactional
    public FamilyResponse createFamily(CreateFamilyRequest request, User creator) {
        FamilyGroup familyGroup = FamilyGroup.builder()
                .name(request.getName())
                .build();

        familyGroupRepository.save(familyGroup);

        // Creator automatically becomes PARENT and admin
        FamilyMember member = FamilyMember.builder()
                .familyGroup(familyGroup)
                .user(creator)
                .role(Role.PARENT)
                .isActive(true)
                .isAdmin(true)
                .build();

        familyMemberRepository.save(member);
        log.info("Family '{}' created by {}", familyGroup.getName(), creator.getEmail());

        return FamilyResponse.builder()
                .id(familyGroup.getId())
                .name(familyGroup.getName())
                .role(Role.PARENT.name())
                .build();
    }

    @Transactional
    public FamilyResponse updateFamilyName(Long familyId, CreateFamilyRequest request, User authenticatedUser) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new FamilyException("FAMILY_NOT_FOUND", "Grupo familiar no encontrado.", 404));

        FamilyMember member = familyMemberRepository.findByFamilyGroupIdAndUserId(familyId, authenticatedUser.getId())
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos para modificar este grupo.", 403));

        if (member.getRole() != Role.PARENT) {
            throw new FamilyException("FORBIDDEN", "No tienes permisos para modificar este grupo.", 403);
        }

        familyGroup.setName(request.getName().trim());
        familyGroupRepository.save(familyGroup);
        log.info("Family '{}' renamed by {}", familyGroup.getName(), authenticatedUser.getEmail());

        return FamilyResponse.builder()
                .id(familyGroup.getId())
                .name(familyGroup.getName())
                .role(Role.PARENT.name())
                .build();
    }

    @Transactional(readOnly = true)
    public FamilyMembersResponse getMembers(Long familyId, User requester) {
        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(m -> m.getIsActive() && m.getRole() == Role.PARENT)
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos para ver los miembros de esta familia.", 403));


        List<MemberItemResponse> members = familyMemberRepository
                .findByFamilyGroupIdAndIsActiveTrue(familyId)
                .stream()
                .map(m -> MemberItemResponse.builder()
                        .id(m.getUser().getId())
                        .name(m.getUser().getName())
                        .email(m.getUser().getEmail())
                        .pictureUrl(m.getUser().getPictureUrl())
                        .role(m.getRole().name())
                        .joinedAt(m.getJoinedAt())
                        .build())
                .toList();

        List<PendingInvitationResponse> pending = invitationRepository
                .findByFamilyGroupIdAndIsUsedFalseAndExpirationDateAfter(familyId, LocalDateTime.now())
                .stream()
                .map(i -> PendingInvitationResponse.builder()
                        .email(i.getInvitedEmail())
                        .role(i.getRole().name())
                        .token(i.getToken().toString())
                        .createdAt(i.getCreatedAt())
                        .expirationDate(i.getExpirationDate())
                        .build())
                .toList();

        return FamilyMembersResponse.builder()
                .members(members)
                .pendingInvitations(pending)
                .build();
    }

    @Transactional
    public MessageResponse updateMemberRole(Long familyId, Long userId, UpdateRoleRequest request, User requester) {
        // Verify requester is an active admin in this family
        FamilyMember requesterMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(m -> m.getIsActive() && Boolean.TRUE.equals(m.getIsAdmin()))
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos para cambiar roles en esta familia.", 403));

        // Find target member
        FamilyMember targetMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, userId)
                .orElseThrow(() -> new FamilyException("MEMBER_NOT_FOUND", "Miembro no encontrado.", 404));

        // Verify target is active
        if (!targetMember.getIsActive()) {
            throw new FamilyException("INACTIVE_MEMBER", "No se puede cambiar el rol de un miembro inactivo.", 400);
        }

        // No-op if role is already the same
        if (targetMember.getRole() == request.getRole()) {
            return new MessageResponse("Rol actualizado exitosamente.");
        }

        // If changing from PARENT to CHILD, ensure at least one PARENT remains
        if (targetMember.getRole() == Role.PARENT && request.getRole() == Role.CHILD) {
            long parentCount = familyMemberRepository.countByFamilyGroupIdAndRoleAndIsActiveTrue(familyId, Role.PARENT);
            if (parentCount <= 1) {
                throw new FamilyException("LAST_PARENT", "Debe existir al menos un Padre/Tutor en la familia.", 409);
            }
        }

        targetMember.setRole(request.getRole());
        familyMemberRepository.save(targetMember);
        log.info("Role of user {} in family {} changed to {} by {}",
                userId, familyId, request.getRole(), requester.getEmail());

        return new MessageResponse("Rol actualizado exitosamente.");
    }
}
