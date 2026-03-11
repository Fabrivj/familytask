package com.vertexdev.familytask.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleCallbackRequest {

    @NotBlank(message = "El código de autorización es requerido")
    private String code;
}