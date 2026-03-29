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
import com.vertexdev.familytask.repository.TaskAssignmentRepository;
import com.vertexdev.familytask.util.FamilyPermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FamilyGroupService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final InvitationRepository invitationRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final FamilyPermissions familyPermissions;

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

        if (!familyPermissions.isActiveParent(member)) {
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
                .filter(familyPermissions::isActiveParent)
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
                        .isAdmin(m.getIsAdmin())
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
    public MessageResponse removeMember(Long familyId, Long userId, User requester) {
        FamilyMember requesterMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos para remover miembros de esta familia.", 403));

        FamilyMember targetMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, userId)
                .orElseThrow(() -> new FamilyException("MEMBER_NOT_FOUND", "Miembro no encontrado.", 404));

        if (!familyPermissions.canRemoveMember(requesterMember, targetMember)) {
            if (Boolean.TRUE.equals(targetMember.getIsAdmin())) {
                throw new FamilyException("CANNOT_REMOVE_ADMIN", "No puedes remover al único Padre/Tutor de la familia.", 409);
            }
            throw new FamilyException("FORBIDDEN", "No tienes permisos para remover miembros de esta familia.", 403);
        }

        if (!targetMember.getIsActive()) {
            throw new FamilyException("INACTIVE_MEMBER", "El miembro ya fue removido de la familia.", 400);
        }

        taskAssignmentRepository.deleteByUserIdAndFamilyGroupId(userId, familyId);
        targetMember.setIsActive(false);
        familyMemberRepository.save(targetMember);
        log.info("Member {} removed from family {} by {}", userId, familyId, requester.getEmail());

        return new MessageResponse("Miembro removido exitosamente.");
    }

    @Transactional
    public MessageResponse updateMemberRole(Long familyId, Long userId, UpdateRoleRequest request, User requester) {
        // Verify requester is an active PARENT in this family
        FamilyMember requesterMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos para cambiar roles en esta familia.", 403));

        // Find target member
        FamilyMember targetMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, userId)
                .orElseThrow(() -> new FamilyException("MEMBER_NOT_FOUND", "Miembro no encontrado.", 404));

        // Non-admin parents cannot modify the admin's role
        if (!familyPermissions.canEditMemberRole(requesterMember, targetMember)) {
            throw new FamilyException("FORBIDDEN", "No tienes permisos para cambiar el rol de este miembro.", 403);
        }

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
