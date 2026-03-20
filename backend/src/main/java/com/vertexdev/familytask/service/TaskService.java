package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.task.CreateTaskRequest;
import com.vertexdev.familytask.dto.task.TaskResponse;
import com.vertexdev.familytask.exception.TaskException;
import com.vertexdev.familytask.mapper.TaskMapper;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.Task;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Priority;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.model.enums.TaskStatus;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.TaskRepository;
import com.vertexdev.familytask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;

    public TaskResponse createTask(CreateTaskRequest request, User creator) {
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new TaskException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), creator.getId())
                .filter(m -> m.getRole() == Role.PARENT && m.getIsActive())
                .orElseThrow(() -> new TaskException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDateTime.now())) {
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
                    .title(request.getTitle().trim())
                    .description(request.getDescription().trim())
                    .location(request.getLocation().trim())
                    .priority(priority)
                    .status(TaskStatus.PENDING)
                    .xpReward(request.getXpReward())
                    .coinsReward(request.getCoinsReward())
                    .dueDate(request.getDueDate())
                    .build();

            taskRepository.save(task);
            log.info("Task '{}' created by user {} in family {}", task.getTitle(), creator.getEmail(), familyGroup.getName());

            return taskMapper.toResponse(task);
        } catch (TaskException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create task for user {}: {}", creator.getEmail(), e.getMessage());
            throw new TaskException("TASK_CREATION_FAILED",
                    "Ocurrió un error al crear la tarea. Por favor, intente nuevamente.", 500);
        }
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
                tasks = taskRepository.findByFamilyGroupIdAndDeletedAtIsNull(familyGroup.getId());
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
