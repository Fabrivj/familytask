package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.ai.SuggestionListResponse;
import com.vertexdev.familytask.dto.ai.SuggestionRequest;
import com.vertexdev.familytask.exception.AiServiceUnavailableException;
import com.vertexdev.familytask.exception.AiSuggestionException;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.service.ai.SuggestionService;
import com.vertexdev.familytask.util.FamilyPermissions;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/suggestions")
@RequiredArgsConstructor
@Slf4j
public class SuggestionController {

    private final SuggestionService suggestionService;
    private final FamilyMemberRepository familyMemberRepository;
    private final FamilyPermissions familyPermissions;

    @PostMapping
    public ResponseEntity<SuggestionListResponse> getSuggestions(
            @Valid @RequestBody SuggestionRequest request,
            @AuthenticationPrincipal User authenticatedUser) {

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(request.getFamilyId(), authenticatedUser.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new AiSuggestionException(
                        "ACCESS_DENIED", "Acceso no autorizado.", 403));

        try {
            SuggestionListResponse response = suggestionService.generate(
                    request.getFamilyId(),
                    request.getCategory(),
                    request.getMemberUserId()
            );
            return ResponseEntity.ok(response);
        } catch (AiServiceUnavailableException | AiSuggestionException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error generating suggestions: {}", e.getMessage(), e);
            throw new AiSuggestionException(
                    "SUGGESTION_ERROR",
                    "No se pudieron obtener las sugerencias. Intenta de nuevo.",
                    500, e);
        }
    }
}
