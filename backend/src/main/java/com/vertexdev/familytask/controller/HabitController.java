package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.habit.AssignHabitRequest;
import com.vertexdev.familytask.dto.habit.CompleteHabitResponse;
import com.vertexdev.familytask.dto.habit.CreateHabitRequest;
import com.vertexdev.familytask.dto.habit.HabitResponse;
import com.vertexdev.familytask.dto.habit.UpdateHabitRequest;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<List<HabitResponse>> getHabits(
            @RequestParam Long familyId,
            @AuthenticationPrincipal User authenticatedUser) {

        List<HabitResponse> habits = habitService.getHabits(familyId, authenticatedUser);
        return ResponseEntity.ok(habits);
    }

    @PostMapping
    public ResponseEntity<HabitResponse> createHabit(
            @Valid @RequestBody CreateHabitRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        HabitResponse response = habitService.createHabit(request, authenticatedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Assigns a habit to a family member.
     * Requires JWT. Only users with PARENT role can assign habits.
     *
     * POST /api/habits/{id}/assign
     */
    @PostMapping("/{id}/assign")
    public ResponseEntity<HabitResponse> assignHabit(
            @PathVariable Long id,
            @Valid @RequestBody AssignHabitRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        return ResponseEntity.ok(habitService.assignHabit(id, request, authenticatedUser));
    }

    /**
     * Marks a habit as completed for the current period.
     * Only the CHILD assigned to the habit can call this endpoint.
     *
     * POST /api/habits/{id}/complete
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<CompleteHabitResponse> completeHabit(
            @PathVariable Long id,
            @AuthenticationPrincipal User authenticatedUser) {

        return ResponseEntity.ok(habitService.completeHabit(id, authenticatedUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitResponse> updateHabit(
            @PathVariable Long id,
            @Valid @RequestBody UpdateHabitRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        return ResponseEntity.ok(habitService.updateHabit(id, request, authenticatedUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteHabit(
            @PathVariable Long id,
            @AuthenticationPrincipal User authenticatedUser) {

        return ResponseEntity.ok(habitService.deleteHabit(id, authenticatedUser));
    }
}
