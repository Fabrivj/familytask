package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.space.CreateSpaceRequest;
import com.vertexdev.familytask.dto.space.SpaceResponse;
import com.vertexdev.familytask.dto.space.UpdateSpaceRequest;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.SpaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;

    /**
     * Returns all spaces for a family.
     * GET /api/spaces?familyId=X
     */
    @GetMapping
    public ResponseEntity<List<SpaceResponse>> getSpaces(
            @RequestParam Long familyId,
            @AuthenticationPrincipal User authenticatedUser) {

        return ResponseEntity.ok(spaceService.getSpaces(familyId, authenticatedUser));
    }

    /**
     * Creates a new space in the active family.
     * Requires PARENT role.
     * POST /api/spaces
     */
    @PostMapping
    public ResponseEntity<SpaceResponse> createSpace(
            @Valid @RequestBody CreateSpaceRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        SpaceResponse response = spaceService.createSpace(request, authenticatedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Updates the name and/or type of an existing space.
     * Requires PARENT role.
     * PUT /api/spaces/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<SpaceResponse> updateSpace(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSpaceRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        SpaceResponse response = spaceService.updateSpace(id, request, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a space. If the space has active tasks, targetSpaceId must be provided
     * to migrate them atomically before deletion.
     * Requires PARENT role.
     * DELETE /api/spaces/{id}?familyId=X&targetSpaceId=Y
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpace(
            @PathVariable Long id,
            @RequestParam Long familyId,
            @RequestParam(required = false) Long targetSpaceId,
            @AuthenticationPrincipal User authenticatedUser) {

        spaceService.deleteSpace(id, familyId, targetSpaceId, authenticatedUser);
        return ResponseEntity.noContent().build();
    }
}
