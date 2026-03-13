package com.vertexdev.familytask.dto.auth;

import lombok.Data;

@Data
public class GoogleCallbackRequest {

    private String code;

    private String error;
}