package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.redemption.RedeemRewardRequest;
import com.vertexdev.familytask.dto.redemption.RedemptionHistoryResponse;
import com.vertexdev.familytask.dto.redemption.RedemptionResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.RedemptionStatus;
import com.vertexdev.familytask.service.RedemptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/redemptions")
@RequiredArgsConstructor
public class RedemptionController {

    private final RedemptionService redemptionService;

    @GetMapping("/history")
    public ResponseEntity<List<RedemptionHistoryResponse>> getHistory(
            @RequestParam Long familyId,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) RedemptionStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @AuthenticationPrincipal User authenticatedUser) {

        List<RedemptionHistoryResponse> history =
                redemptionService.getHistory(familyId, memberId, status, dateFrom, dateTo, authenticatedUser);
        return ResponseEntity.ok(history);
    }

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
