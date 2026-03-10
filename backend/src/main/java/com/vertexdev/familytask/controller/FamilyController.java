package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.familia.CreateFamilyRequest;
import com.vertexdev.familytask.dto.familia.FamilyResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.FamilyGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/familias")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyGroupService familyGroupService;

    @PostMapping
    public ResponseEntity<FamilyResponse> crearFamilia(
            @Valid @RequestBody CreateFamilyRequest request,
            @AuthenticationPrincipal User userAutenticado) {

        FamilyResponse response = familyGroupService.crearFamilia(request, userAutenticado);
        return ResponseEntity.ok(response);
    }
}