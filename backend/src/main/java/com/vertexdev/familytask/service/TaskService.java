package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.task.CreateTaskRequest;
import com.vertexdev.familytask.dto.task.TaskResponse;
import com.vertexdev.familytask.exception.TaskException;
import com.vertexdev.familytask.mapper.TaskMapper;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.Space;
import com.vertexdev.familytask.model.Task;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Priority;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.util.FamilyPermissions;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.SpaceRepository;
import com.vertexdev.familytask.repository.TaskRepository;
import com.vertexdev.familytask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vertexdev.familytask.dto.task.UpdateTaskRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    private final FamilyPermissions familyPermissions;

    public TaskResponse createTask(CreateTaskRequest request, User creator) {
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new TaskException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), creator.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new TaskException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        Space homeSpace = spaceRepository.findById(request.getHomeSpaceId())
                .orElseThrow(() -> new TaskException("SPACE_NOT_FOUND", "El espacio no existe.", 404));

        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDate.now())) {
            throw new TaskException("INVALID_DUE_DATE",
                    "La fecha límite debe ser igual o posterior a la fecha actual.", 400);
        }

        Priority priority;
        try {
            priority = Priority.valueOf(request.getPriority());
        } catch (IllegalArgumentException e) {
            throw new TaskException("INVALID_PRIORITY", "El campo Prioridad es obligatorio.", 400);
        }

        User assignedTo = null;
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new TaskException("USER_NOT_FOUND", "El usuario asignado no existe.", 404));
            final User finalAssignedTo = assignedTo;
            boolean isMember = familyMemberRepository
                    .findByFamilyGroupIdAndIsActiveTrue(familyGroup.getId())
                    .stream()
                    .anyMatch(m -> m.getUser().getId().equals(finalAssignedTo.getId()));
            if (!isMember) {
                throw new TaskException("NOT_A_MEMBER", "El usuario asignado no pertenece a esta familia.", 400);
            }
        }

        try {
            Task task = Task.builder()
                    .familyGroup(familyGroup)
                    .createdBy(creator)
                    .assignedTo(assignedTo)
                    .homeSpace(homeSpace)
                    .title(request.getTitle().trim())
                    .description(request.getDescription().trim())
                    .priority(priority)
                    .xpReward(request.getXpReward())
                    .coinsReward(request.getCoinsReward())
                    .dueDate(request.getDueDate())
                    .build();

            taskRepository.save(task);
            log.info("Task '{}' created by user {} in family {} at space '{}'",
                    task.getTitle(), creator.getEmail(), familyGroup.getName(), homeSpace.getName());

            return taskMapper.toResponse(task);
        } catch (TaskException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create task for user {}: {}", creator.getEmail(), e.getMessage());
            throw new TaskException("TASK_CREATION_FAILED",
                    "Ocurrió un error al crear la tarea. Por favor, intente nuevamente.", 500);
        }
    }

    public TaskResponse updateTask(Long taskId, UpdateTaskRequest request, User editor) {
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new TaskException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), editor.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new TaskException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new TaskException("TASK_NOT_FOUND", "La tarea no existe.", 404));

        if (!task.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new TaskException("ACCESS_DENIED", "La tarea no pertenece a esta familia.", 403);
        }

        Space homeSpace = spaceRepository.findById(request.getHomeSpaceId())
                .orElseThrow(() -> new TaskException("SPACE_NOT_FOUND", "El espacio no existe.", 404));

        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDate.now())) {
            throw new TaskException("INVALID_DUE_DATE",
                    "La fecha límite debe ser igual o posterior a la fecha actual.", 400);
        }

        Priority priority;
        try {
            priority = Priority.valueOf(request.getPriority());
        } catch (IllegalArgumentException e) {
            throw new TaskException("INVALID_PRIORITY", "El campo Prioridad es obligatorio.", 400);
        }

        User assignedTo = null;
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new TaskException("USER_NOT_FOUND", "El usuario asignado no existe.", 404));
            final User finalAssignedTo = assignedTo;
            boolean isMember = familyMemberRepository
                    .findByFamilyGroupIdAndIsActiveTrue(familyGroup.getId())
                    .stream()
                    .anyMatch(m -> m.getUser().getId().equals(finalAssignedTo.getId()));
            if (!isMember) {
                throw new TaskException("NOT_A_MEMBER", "El usuario asignado no pertenece a esta familia.", 400);
            }
        }

        try {
            task.setTitle(request.getTitle().trim());
            task.setDescription(request.getDescription().trim());
            task.setPriority(priority);
            task.setHomeSpace(homeSpace);
            task.setXpReward(request.getXpReward());
            task.setCoinsReward(request.getCoinsReward());
            task.setDueDate(request.getDueDate());
            task.setAssignedTo(assignedTo);

            taskRepository.save(task);
            log.info("Task '{}' updated by user {} in family {}",
                    task.getTitle(), editor.getEmail(), familyGroup.getName());

            return taskMapper.toResponse(task);
        } catch (TaskException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to update task {} for user {}: {}", taskId, editor.getEmail(), e.getMessage());
            throw new TaskException("TASK_UPDATE_FAILED",
                    "Ocurrió un error al actualizar la tarea. Por favor, intente nuevamente.", 500);
        }
    }

    public MessageResponse deleteTask(Long taskId, User requester) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new TaskException("TASK_NOT_FOUND", "Tarea no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(task.getFamilyGroup().getId(), requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new TaskException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        task.setDeletedAt(LocalDateTime.now());
        taskRepository.save(task);
        log.info("Task '{}' deleted by user {}", task.getTitle(), requester.getEmail());
        return new MessageResponse("Tarea eliminada correctamente.");
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(Long familyId, User requester) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new TaskException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        FamilyMember member = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), requester.getId())
                .filter(m -> m.getIsActive())
                .orElseThrow(() -> new TaskException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        try {
            List<Task> tasks;
            if (member.getRole() == Role.CHILD) {
                tasks = taskRepository.findVisibleTasksForChild(familyGroup.getId(), requester.getId());
            } else {
                tasks = taskRepository.findActiveByFamilyGroupId(familyGroup.getId());
            }
            return tasks.stream()
                    .map(taskMapper::toResponse)
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch tasks for family {}: {}", familyId, e.getMessage());
            throw new TaskException("FETCH_FAILED",
                    "Error al cargar las tareas. Por favor, intente nuevamente.", 500);
        }
    }
}
