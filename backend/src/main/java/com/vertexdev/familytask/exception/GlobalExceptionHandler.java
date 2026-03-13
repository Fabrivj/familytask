package com.vertexdev.familytask.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(AuthException ex) {
        HttpStatus status = switch (ex.getCode()) {
            case "EMAIL_NOT_FOUND", "LOGIN_CANCELLED" -> HttpStatus.BAD_REQUEST;
            case "GOOGLE_CONNECTION_ERROR" -> HttpStatus.BAD_GATEWAY;
            default -> HttpStatus.UNAUTHORIZED;
        };

        return ResponseEntity.status(status)
                .body(ErrorResponse.builder()
                        .code(ex.getCode())
                        .message(ex.getMessage())
                        .build());
    }
}
