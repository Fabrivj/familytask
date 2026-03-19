package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.task.CreateTaskRequest;
import com.vertexdev.familytask.dto.task.TaskResponse;
import com.vertexdev.familytask.exception.TaskException;
import com.vertexdev.familytask.mapper.TaskMapper;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.Task;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Priority;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.model.enums.TaskStatus;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
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

        try {
            Task task = Task.builder()
                    .familyGroup(familyGroup)
                    .createdBy(creator)
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
        } catch (Exception e) {
            log.error("Failed to create task for user {}: {}", creator.getEmail(), e.getMessage());
            throw new TaskException("TASK_CREATION_FAILED",
                    "Ocurrió un error al crear la tarea. Por favor, intente nuevamente.", 500);
        }
    }
}
