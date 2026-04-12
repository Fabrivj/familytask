package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.redemption.RedeemRewardRequest;
import com.vertexdev.familytask.dto.redemption.RedemptionResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.RedemptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/redemptions")
@RequiredArgsConstructor
public class RedemptionController {

    private final RedemptionService redemptionService;

    @PostMapping
    public ResponseEntity<RedemptionResponse> requestRedemption(
            @Valid @RequestBody RedeemRewardRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        RedemptionResponse response = redemptionService.requestRedemption(request, authenticatedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RedemptionResponse>> getMyRedemptions(
            @RequestParam Long familyId,
            @AuthenticationPrincipal User authenticatedUser) {

        List<RedemptionResponse> redemptions = redemptionService.getMyRedemptions(familyId, authenticatedUser);
        return ResponseEntity.ok(redemptions);
    }
}
