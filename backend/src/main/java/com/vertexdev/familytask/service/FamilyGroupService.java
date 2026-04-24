package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.family.CreateFamilyRequest;
import com.vertexdev.familytask.dto.family.FamilyActivityResponse;
import com.vertexdev.familytask.dto.family.FamilyMembersResponse;
import com.vertexdev.familytask.dto.family.FamilyResponse;
import com.vertexdev.familytask.dto.family.MemberItemResponse;
import com.vertexdev.familytask.dto.family.PendingInvitationResponse;
import com.vertexdev.familytask.dto.family.UpdateAdminRequest;
import com.vertexdev.familytask.dto.family.UpdateFamilySettingsRequest;
import com.vertexdev.familytask.dto.family.UpdateRoleRequest;
import com.vertexdev.familytask.exception.FamilyException;
import com.vertexdev.familytask.model.FamilyActivity;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.ActivityAction;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyActivityRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.InvitationRepository;
import com.vertexdev.familytask.repository.TaskAssignmentRepository;
import com.vertexdev.familytask.util.FamilyPermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FamilyGroupService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final InvitationRepository invitationRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final FamilyActivityRepository familyActivityRepository;
    private final FamilyPermissions familyPermissions;
    private final ExperienceService experienceService;

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
                .rankingEnabled(familyGroup.getRankingEnabled())
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
                .rankingEnabled(familyGroup.getRankingEnabled())
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
                .map(m -> toMemberItemResponse(m, familyId))
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

    @Transactional(readOnly = true)
    public MemberItemResponse getMyStats(Long familyId, User requester) {
        FamilyMember me = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(FamilyMember::getIsActive)
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No eres miembro activo de esta familia.", 403));

        return toMemberItemResponse(me, familyId);
    }

    @Transactional
    public MessageResponse removeMember(Long familyId, Long userId, User requester) {
        FamilyMember requesterMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos para remover miembros de esta familia.", 403));

        FamilyMember targetMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, userId)
                .orElseThrow(() -> new FamilyException("MEMBER_NOT_FOUND", "Miembro no encontrado.", 404));

        // Admin cannot remove themselves
        if (requester.getId().equals(userId)) {
            throw new FamilyException("CANNOT_REMOVE_SELF", "No puedes eliminarte a ti mismo como administrador.", 409);
        }

        if (!familyPermissions.canRemoveMember(requesterMember, targetMember)) {
            throw new FamilyException("FORBIDDEN", "No tienes permisos para remover miembros de esta familia.", 403);
        }

        // If removing an admin, ensure at least one admin remains
        if (Boolean.TRUE.equals(targetMember.getIsAdmin())) {
            long adminCount = familyMemberRepository.countByFamilyGroupIdAndIsAdminTrueAndIsActiveTrue(familyId);
            if (adminCount <= 1) {
                throw new FamilyException("LAST_ADMIN", "Debe existir al menos un administrador en la familia.", 409);
            }
        }

        if (!targetMember.getIsActive()) {
            throw new FamilyException("INACTIVE_MEMBER", "El miembro ya fue removido de la familia.", 400);
        }

        taskAssignmentRepository.deleteByUserIdAndFamilyGroupId(userId, familyId);
        targetMember.setIsActive(false);
        familyMemberRepository.save(targetMember);

        logActivity(requesterMember.getFamilyGroup(), requester, targetMember.getUser(),
                ActivityAction.MEMBER_REMOVED,
                "Miembro " + targetMember.getUser().getName() + " removido de la familia.");

        log.info("Member {} removed from family {} by {}", userId, familyId, requester.getEmail());

        return new MessageResponse("Miembro removido exitosamente.");
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
        // Admin cannot change their own role
        if (requester.getId().equals(userId)) {
            throw new FamilyException("CANNOT_CHANGE_OWN_ROLE", "Un administrador no puede cambiar su propio rol.", 409);
        }

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
            // If target was admin, remove admin flag when demoting to CHILD
            if (Boolean.TRUE.equals(targetMember.getIsAdmin())) {
                targetMember.setIsAdmin(false);
            }
        }

        Role previousRole = targetMember.getRole();
        targetMember.setRole(request.getRole());
        familyMemberRepository.save(targetMember);

        logActivity(requesterMember.getFamilyGroup(), requester, targetMember.getUser(),
                ActivityAction.ROLE_CHANGED,
                "Rol de " + targetMember.getUser().getName() + " cambiado de " + previousRole.name() + " a " + request.getRole().name() + ".");

        log.info("Role of user {} in family {} changed to {} by {}",
                userId, familyId, request.getRole(), requester.getEmail());

        return new MessageResponse("Rol actualizado exitosamente.");
    }

    @Transactional
    public MessageResponse updateAdminStatus(Long familyId, Long userId, UpdateAdminRequest request, User requester) {
        // Admin cannot change their own admin status
        if (requester.getId().equals(userId)) {
            throw new FamilyException("CANNOT_CHANGE_OWN_ROLE", "Un administrador no puede cambiar su propio rol.", 409);
        }

        FamilyMember requesterMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos en esta familia.", 403));

        FamilyMember targetMember = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, userId)
                .orElseThrow(() -> new FamilyException("MEMBER_NOT_FOUND", "Miembro no encontrado.", 404));

        if (!familyPermissions.canChangeAdminStatus(requesterMember, targetMember)) {
            throw new FamilyException("FORBIDDEN", "No tienes permisos para cambiar el estado de administrador de este miembro.", 403);
        }

        if (!targetMember.getIsActive()) {
            throw new FamilyException("INACTIVE_MEMBER", "No se puede cambiar el estado de un miembro inactivo.", 400);
        }

        // No-op if already in requested state
        if (Boolean.TRUE.equals(targetMember.getIsAdmin()) == Boolean.TRUE.equals(request.getIsAdmin())) {
            return new MessageResponse("Estado de administrador actualizado exitosamente.");
        }

        targetMember.setIsAdmin(request.getIsAdmin());
        familyMemberRepository.save(targetMember);

        ActivityAction action = Boolean.TRUE.equals(request.getIsAdmin()) ? ActivityAction.ADMIN_PROMOTED : ActivityAction.ADMIN_DEMOTED;
        String detail = Boolean.TRUE.equals(request.getIsAdmin())
                ? targetMember.getUser().getName() + " promovido a Administrador."
                : targetMember.getUser().getName() + " removido como Administrador.";

        logActivity(requesterMember.getFamilyGroup(), requester, targetMember.getUser(), action, detail);

        log.info("Admin status of user {} in family {} changed to {} by {}",
                userId, familyId, request.getIsAdmin(), requester.getEmail());

        return new MessageResponse("Estado de administrador actualizado exitosamente.");
    }

    @Transactional(readOnly = true)
    public List<FamilyActivityResponse> getActivityLog(Long familyId, User requester, int page, int size) {
        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos para ver el historial de esta familia.", 403));

        return familyActivityRepository
                .findByFamilyGroupIdOrderByCreatedAtDesc(familyId, PageRequest.of(page, size))
                .stream()
                .map(this::toActivityResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FamilyResponse getFamilySettings(Long familyId, User requester) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new FamilyException("FAMILY_NOT_FOUND", "Grupo familiar no encontrado.", 404));

        FamilyMember member = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos para ver la configuración de este grupo.", 403));

        return FamilyResponse.builder()
                .id(familyGroup.getId())
                .name(familyGroup.getName())
                .role(member.getRole().name())
                .rankingEnabled(familyGroup.getRankingEnabled())
                .build();
    }

    @Transactional
    public FamilyResponse updateSettings(Long familyId, UpdateFamilySettingsRequest request, User authenticatedUser) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new FamilyException("FAMILY_NOT_FOUND", "Grupo familiar no encontrado.", 404));

        FamilyMember member = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, authenticatedUser.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No tienes permisos para modificar este grupo.", 403));

        familyGroup.setRankingEnabled(request.getRankingEnabled());
        familyGroupRepository.save(familyGroup);
        log.info("Family {} settings updated by {}: rankingEnabled={}", familyId, authenticatedUser.getEmail(), request.getRankingEnabled());

        return FamilyResponse.builder()
                .id(familyGroup.getId())
                .name(familyGroup.getName())
                .role(member.getRole().name())
                .rankingEnabled(familyGroup.getRankingEnabled())
                .build();
    }

    @Transactional(readOnly = true)
    public List<MemberItemResponse> getRanking(Long familyId, User requester) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new FamilyException("FAMILY_NOT_FOUND", "Grupo familiar no encontrado.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(FamilyMember::getIsActive)
                .orElseThrow(() -> new FamilyException("FORBIDDEN", "No eres miembro activo de esta familia.", 403));

        if (!Boolean.TRUE.equals(familyGroup.getRankingEnabled())) {
            throw new FamilyException("RANKING_DISABLED", "El ranking no está habilitado para esta familia.", 403);
        }

        return familyMemberRepository
                .findByFamilyGroupIdAndIsActiveTrue(familyId)
                .stream()
                .sorted(Comparator.comparingInt(FamilyMember::getTotalXp).reversed())
                .map(m -> toMemberItemResponse(m, familyId))
                .toList();
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

    private FamilyActivityResponse toActivityResponse(FamilyActivity a) {
        return FamilyActivityResponse.builder()
                .id(a.getId())
                .action(a.getAction().name())
                .performedByName(a.getPerformedBy().getName())
                .performedByPictureUrl(a.getPerformedBy().getPictureUrl())
                .targetUserName(a.getTargetUser() != null ? a.getTargetUser().getName() : null)
                .details(a.getDetails())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private MemberItemResponse toMemberItemResponse(FamilyMember m, Long familyId) {
        long completed = taskAssignmentRepository.countByUserIdAndFamilyGroupIdAndStatus(
                m.getUser().getId(), familyId, com.vertexdev.familytask.model.enums.TaskStatus.COMPLETED);

        return MemberItemResponse.builder()
                .id(m.getUser().getId())
                .name(m.getUser().getName())
                .email(m.getUser().getEmail())
                .pictureUrl(m.getUser().getPictureUrl())
                .role(m.getRole().name())
                .isAdmin(m.getIsAdmin())
                .joinedAt(m.getJoinedAt())
                .totalXp(m.getTotalXp())
                .currentLevel(m.getCurrentLevel())
                .totalCoins(m.getTotalCoins())
                .xpToNextLevel(experienceService.xpToNextLevel(m.getTotalXp()))
                .completedTaskCount(completed)
                .build();
    }
}
