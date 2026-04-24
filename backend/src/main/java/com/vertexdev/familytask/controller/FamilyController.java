package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.family.CreateFamilyRequest;
import com.vertexdev.familytask.dto.family.FamilyActivityResponse;
import com.vertexdev.familytask.dto.family.FamilyMembersResponse;
import com.vertexdev.familytask.dto.family.FamilyResponse;
import com.vertexdev.familytask.dto.family.MemberItemResponse;
import com.vertexdev.familytask.dto.family.UpdateAdminRequest;
import com.vertexdev.familytask.dto.family.UpdateFamilySettingsRequest;
import com.vertexdev.familytask.dto.family.UpdateRoleRequest;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.FamilyGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;


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

    @GetMapping("/{familyId}/members/me")
    public ResponseEntity<MemberItemResponse> getMyStats(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User authenticatedUser) {

        MemberItemResponse response = familyGroupService.getMyStats(familyId, authenticatedUser);
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

    @PatchMapping("/{familyId}/members/{userId}/admin")
    public ResponseEntity<MessageResponse> updateMemberAdmin(
            @PathVariable Long familyId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateAdminRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        MessageResponse response = familyGroupService.updateAdminStatus(familyId, userId, request, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{familyId}/activity")
    public ResponseEntity<List<FamilyActivityResponse>> getActivityLog(
            @PathVariable Long familyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User authenticatedUser) {

        List<FamilyActivityResponse> response = familyGroupService.getActivityLog(familyId, authenticatedUser, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{familyId}/settings")
    public ResponseEntity<FamilyResponse> getFamilySettings(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User authenticatedUser) {

        FamilyResponse response = familyGroupService.getFamilySettings(familyId, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{familyId}/settings")
    public ResponseEntity<FamilyResponse> updateSettings(
            @PathVariable Long familyId,
            @Valid @RequestBody UpdateFamilySettingsRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        FamilyResponse response = familyGroupService.updateSettings(familyId, request, authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{familyId}/ranking")
    public ResponseEntity<List<MemberItemResponse>> getRanking(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User authenticatedUser) {

        List<MemberItemResponse> response = familyGroupService.getRanking(familyId, authenticatedUser);
        return ResponseEntity.ok(response);
    }
}
