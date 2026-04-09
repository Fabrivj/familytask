package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.task.CompleteTaskResponse;
import com.vertexdev.familytask.dto.task.CreateTaskRequest;
import com.vertexdev.familytask.dto.task.UpdateTaskRequest;
import com.vertexdev.familytask.dto.task.UpdateTaskStatusRequest;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
     * Updates an existing task.
     * Requires JWT. Only users with PARENT role can update tasks.
     *
     * PUT /api/tasks/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        TaskResponse response = taskService.updateTask(id, request, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Updates the status of a task assignment.
     * Requires JWT. PARENT can update any assigned task; CHILD can only update tasks assigned to them.
     *
     * PATCH /api/tasks/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        return ResponseEntity.ok(taskService.updateTaskStatus(id, request, authenticatedUser));
    }

    /**
     * Marks a task as completed. Only PARENT can call this endpoint.
     * The task must be in IN_REVIEW status. Creates a task_completions record.
     *
     * POST /api/tasks/{id}/complete
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<CompleteTaskResponse> completeTask(
            @PathVariable Long id,
            @AuthenticationPrincipal User authenticatedUser) {

        return ResponseEntity.ok(taskService.completeTask(id, authenticatedUser));
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
