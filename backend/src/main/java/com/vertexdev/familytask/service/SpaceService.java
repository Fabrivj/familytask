package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.space.CreateSpaceRequest;
import com.vertexdev.familytask.dto.space.SpaceResponse;
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
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new SpaceException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), creator.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new SpaceException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        SpaceType spaceType;
        try {
            spaceType = SpaceType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new SpaceException("INVALID_TYPE", "El tipo de espacio no es válido.", 400);
        }

        try {
            Space space = Space.builder()
                    .name(request.getName().trim())
                    .type(spaceType)
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
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new SpaceException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), requester.getId())
                .filter(m -> m.getIsActive())
                .orElseThrow(() -> new SpaceException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        try {
            return spaceRepository.findByFamilyGroupId(familyGroup.getId())
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

    public void deleteSpace(Long spaceId, Long familyId, Long targetSpaceId, User requester) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new SpaceException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new SpaceException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new SpaceException("SPACE_NOT_FOUND", "Espacio no encontrado.", 404));

        // Verify the space belongs to this family (created by an active member of the family)
        List<Space> familySpaces = spaceRepository.findByFamilyGroupId(familyGroup.getId());
        boolean belongsToFamily = familySpaces.stream().anyMatch(s -> s.getId().equals(spaceId));
        if (!belongsToFamily) {
            throw new SpaceException("SPACE_NOT_FOUND", "Espacio no encontrado.", 404);
        }

        // Check for active tasks in this space
        if (taskRepository.existsByHomeSpaceIdAndDeletedAtIsNull(spaceId)) {
            if (targetSpaceId == null) {
                throw new SpaceException("SPACE_HAS_TASKS",
                        "No es posible eliminar este espacio porque tiene tareas asignadas.", 409);
            }

            // Validate target space exists and belongs to the same family
            Space targetSpace = spaceRepository.findById(targetSpaceId)
                    .orElseThrow(() -> new SpaceException("TARGET_SPACE_NOT_FOUND",
                            "El espacio destino no fue encontrado.", 404));

            boolean targetBelongsToFamily = familySpaces.stream().anyMatch(s -> s.getId().equals(targetSpaceId));
            if (!targetBelongsToFamily) {
                throw new SpaceException("TARGET_SPACE_NOT_FOUND",
                        "El espacio destino no pertenece a esta familia.", 404);
            }

            // Bulk reassign all active tasks to the target space
            List<Task> tasks = taskRepository.findByHomeSpaceIdAndDeletedAtIsNull(spaceId);
            tasks.forEach(t -> t.setHomeSpace(targetSpace));
            taskRepository.saveAll(tasks);
            log.info("Migrated {} tasks from space {} to space {}", tasks.size(), spaceId, targetSpaceId);
        }

        spaceRepository.delete(space);
        log.info("Space '{}' (id={}) deleted by user {} in family '{}'",
                space.getName(), spaceId, requester.getEmail(), familyGroup.getName());
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
