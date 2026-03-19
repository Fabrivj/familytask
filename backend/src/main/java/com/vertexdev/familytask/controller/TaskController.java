package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.task.CreateTaskRequest;
import com.vertexdev.familytask.dto.task.TaskResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

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
}
