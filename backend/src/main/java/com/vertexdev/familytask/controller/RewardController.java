package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.reward.CreateRewardRequest;
import com.vertexdev.familytask.dto.reward.RewardResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.RewardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;

    @GetMapping
    public ResponseEntity<List<RewardResponse>> getRewards(
            @RequestParam Long familyId,
            @AuthenticationPrincipal User authenticatedUser) {

        List<RewardResponse> rewards = rewardService.getRewards(familyId, authenticatedUser);
        return ResponseEntity.ok(rewards);
    }

    @PostMapping
    public ResponseEntity<RewardResponse> createReward(
            @Valid @RequestBody CreateRewardRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        RewardResponse response = rewardService.createReward(request, authenticatedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteReward(
            @PathVariable Long id,
            @AuthenticationPrincipal User authenticatedUser) {

        return ResponseEntity.ok(rewardService.deleteReward(id, authenticatedUser));
    }
}
