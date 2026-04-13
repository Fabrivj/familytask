package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.badge.BadgeResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families/{familyId}/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    @GetMapping
    public ResponseEntity<List<BadgeResponse>> getBadges(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(badgeService.getBadgesForUser(familyId, user));
    }
}
