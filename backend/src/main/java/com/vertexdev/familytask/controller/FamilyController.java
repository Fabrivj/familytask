package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.family.CreateFamilyRequest;
import com.vertexdev.familytask.dto.family.FamilyMembersResponse;
import com.vertexdev.familytask.dto.family.FamilyResponse;
import com.vertexdev.familytask.dto.family.UpdateRoleRequest;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.FamilyGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyGroupService familyGroupService;

    @PostMapping
    public ResponseEntity<FamilyResponse> createFamily(
            @Valid @RequestBody CreateFamilyRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        FamilyResponse response = familyGroupService.createFamily(request, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<FamilyResponse> updateFamily(
            @PathVariable Long id,
            @Valid @RequestBody CreateFamilyRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        FamilyResponse response = familyGroupService.updateFamilyName(id, request, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{familyId}/members")
    public ResponseEntity<FamilyMembersResponse> getMembers(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User authenticatedUser) {

        FamilyMembersResponse response = familyGroupService.getMembers(familyId, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{familyId}/members/{userId}")
    public ResponseEntity<MessageResponse> removeMember(
            @PathVariable Long familyId,
            @PathVariable Long userId,
            @AuthenticationPrincipal User authenticatedUser) {

        MessageResponse response = familyGroupService.removeMember(familyId, userId, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{familyId}/members/{userId}/role")
    public ResponseEntity<MessageResponse> updateMemberRole(
            @PathVariable Long familyId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateRoleRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        MessageResponse response = familyGroupService.updateMemberRole(familyId, userId, request, authenticatedUser);
        return ResponseEntity.ok(response);
    }
}
