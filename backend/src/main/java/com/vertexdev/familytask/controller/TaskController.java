package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.task.CreateTaskRequest;
import com.vertexdev.familytask.dto.task.TaskResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * Returns all tasks for a family (non-deleted).
     * PARENT sees all tasks. Requires JWT.
     *
     * GET /api/tasks?familyId=X
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam Long familyId,
            @AuthenticationPrincipal User authenticatedUser) {

        List<TaskResponse> tasks = taskService.getTasks(familyId, authenticatedUser);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Creates a new task in the active family.
     * Requires JWT. Only users with PARENT role can create tasks.
     *
     * POST /api/tasks
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        TaskResponse response = taskService.createTask(request, authenticatedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Soft-deletes a task (sets deletedAt).
     * Requires JWT. Only users with PARENT role in the same family can delete.
     *
     * DELETE /api/tasks/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal User authenticatedUser) {

        return ResponseEntity.ok(taskService.deleteTask(id, authenticatedUser));
    }
}
