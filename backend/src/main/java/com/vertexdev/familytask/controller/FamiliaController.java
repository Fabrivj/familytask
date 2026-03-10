package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.familia.CrearFamiliaRequest;
import com.vertexdev.familytask.dto.familia.FamiliaResponse;
import com.vertexdev.familytask.model.Usuario;
import com.vertexdev.familytask.service.FamiliaService;
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
public class FamiliaController {

    private final FamiliaService familiaService;

    @PostMapping
    public ResponseEntity<FamiliaResponse> crearFamilia(
            @Valid @RequestBody CrearFamiliaRequest request,
            @AuthenticationPrincipal Usuario usuarioAutenticado) {

        FamiliaResponse response = familiaService.crearFamilia(request, usuarioAutenticado);
        return ResponseEntity.ok(response);
    }
}