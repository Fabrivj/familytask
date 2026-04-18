package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.space.CreateSpaceRequest;
import com.vertexdev.familytask.dto.space.SpaceResponse;
import com.vertexdev.familytask.dto.space.UpdateSpaceRequest;
import com.vertexdev.familytask.exception.SpaceException;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.Space;
import com.vertexdev.familytask.model.Task;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.SpaceType;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.SpaceRepository;
import com.vertexdev.familytask.repository.TaskRepository;
import com.vertexdev.familytask.util.FamilyPermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final TaskRepository taskRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final FamilyPermissions familyPermissions;

    public SpaceResponse createSpace(CreateSpaceRequest request, User creator) {
        FamilyGroup familyGroup = resolveFamily(request.getFamilyId());
        requireParentAccess(familyGroup, creator);
        SpaceType spaceType = parseSpaceType(request.getType());

        try {
            Space space = Space.builder()
                    .name(request.getName().trim())
                    .type(spaceType)
                    .familyGroup(familyGroup)
                    .createdBy(creator)
                    .build();
            spaceRepository.save(space);
            log.info("Space '{}' ({}) created by user {} in family {}",
                    space.getName(), space.getType(), creator.getEmail(), familyGroup.getName());
            return toResponse(space);
        } catch (SpaceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create space for user {}: {}", creator.getEmail(), e.getMessage());
            throw new SpaceException("SPACE_CREATION_FAILED", "No se pudo crear el espacio. Intenta de nuevo.", 500);
        }
    }

    @Transactional(readOnly = true)
    public List<SpaceResponse> getSpaces(Long familyId, User requester) {
        FamilyGroup familyGroup = resolveFamily(familyId);
        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), requester.getId())
                .filter(m -> m.getIsActive())
                .orElseThrow(() -> new SpaceException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        try {
            return spaceRepository.findByFamilyGroupIdOrderByCreatedAtAsc(familyGroup.getId())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        } catch (SpaceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch spaces for family {}: {}", familyId, e.getMessage());
            throw new SpaceException("FETCH_FAILED", "No se pudo cargar los espacios. Intenta de nuevo.", 500);
        }
    }

    public SpaceResponse updateSpace(Long spaceId, UpdateSpaceRequest request, User requester) {
        FamilyGroup familyGroup = resolveFamily(request.getFamilyId());
        requireParentAccess(familyGroup, requester);
        Space space = resolveOwnedSpace(spaceId, familyGroup.getId());
        SpaceType spaceType = parseSpaceType(request.getType());

        try {
            space.setName(request.getName().trim());
            space.setType(spaceType);
            spaceRepository.save(space);
            log.info("Space '{}' (id={}) updated by user {} in family '{}'",
                    space.getName(), spaceId, requester.getEmail(), familyGroup.getName());
            return toResponse(space);
        } catch (SpaceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update space {} for user {}: {}", spaceId, requester.getEmail(), e.getMessage());
            throw new SpaceException("SPACE_UPDATE_FAILED", "No se pudo actualizar el espacio. Intenta de nuevo.", 500);
        }
    }

    public void deleteSpace(Long spaceId, Long familyId, Long targetSpaceId, User requester) {
        FamilyGroup familyGroup = resolveFamily(familyId);
        requireParentAccess(familyGroup, requester);
        Space space = resolveOwnedSpace(spaceId, familyGroup.getId());

        if (taskRepository.existsByHomeSpaceIdAndDeletedAtIsNull(spaceId)) {
            if (targetSpaceId == null) {
                throw new SpaceException("SPACE_HAS_TASKS",
                        "No es posible eliminar este espacio porque tiene tareas asignadas.", 409);
            }
            Space targetSpace = resolveOwnedSpace(targetSpaceId, familyGroup.getId());
            List<Task> activeTasks = taskRepository.findByHomeSpaceIdAndDeletedAtIsNull(spaceId);
            activeTasks.forEach(t -> t.setHomeSpace(targetSpace));
            taskRepository.saveAll(activeTasks);
            log.info("Migrated {} tasks from space {} to space {}", activeTasks.size(), spaceId, targetSpaceId);
        }

        // Soft-deleted tasks still hold a non-nullable FK to this space — hard-delete them
        List<Task> softDeletedTasks = taskRepository.findByHomeSpaceId(spaceId).stream()
                .filter(t -> t.getDeletedAt() != null)
                .toList();
        if (!softDeletedTasks.isEmpty()) {
            taskRepository.deleteAll(softDeletedTasks);
            log.info("Purged {} soft-deleted tasks from space {}", softDeletedTasks.size(), spaceId);
        }

        spaceRepository.delete(space);
        log.info("Space '{}' (id={}) deleted by user {} in family '{}'",
                space.getName(), spaceId, requester.getEmail(), familyGroup.getName());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private FamilyGroup resolveFamily(Long familyId) {
        return familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new SpaceException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));
    }

    private void requireParentAccess(FamilyGroup familyGroup, User user) {
        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), user.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new SpaceException("ACCESS_DENIED", "Acceso no autorizado.", 403));
    }

    private Space resolveOwnedSpace(Long spaceId, Long familyGroupId) {
        return spaceRepository.findByIdAndFamilyGroupId(spaceId, familyGroupId)
                .orElseThrow(() -> new SpaceException("SPACE_NOT_FOUND", "Espacio no encontrado.", 404));
    }

    private SpaceType parseSpaceType(String type) {
        try {
            return SpaceType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new SpaceException("INVALID_TYPE", "El tipo de espacio no es válido.", 400);
        }
    }

    private SpaceResponse toResponse(Space space) {
        return SpaceResponse.builder()
                .id(space.getId())
                .name(space.getName())
                .type(space.getType().name())
                .createdById(space.getCreatedBy().getId())
                .createdByName(space.getCreatedBy().getName())
                .createdAt(space.getCreatedAt() != null ? space.getCreatedAt().toString() : null)
                .updatedAt(space.getUpdatedAt() != null ? space.getUpdatedAt().toString() : null)
                .build();
    }
}
