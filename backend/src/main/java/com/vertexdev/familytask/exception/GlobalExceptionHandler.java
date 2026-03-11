package com.vertexdev.familytask.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(AuthException ex) {
        HttpStatus status = "EMAIL_NOT_FOUND".equals(ex.getCode())
                ? HttpStatus.BAD_REQUEST
                : HttpStatus.UNAUTHORIZED;

        return ResponseEntity.status(status)
                .body(ErrorResponse.builder()
                        .code(ex.getCode())
                        .message(ex.getMessage())
                        .build());
    }
}
