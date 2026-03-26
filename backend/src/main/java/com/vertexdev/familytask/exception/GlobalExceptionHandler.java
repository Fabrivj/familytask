package com.vertexdev.familytask.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .code("INVALID_REQUEST")
                        .message("El formato de los datos enviados es inválido.")
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())
                .orElse("Datos inválidos.");

        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .code("VALIDATION_ERROR")
                        .message(message)
                        .build());
    }

    @ExceptionHandler(InvitationException.class)
    public ResponseEntity<ErrorResponse> handleInvitationException(InvitationException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .body(ErrorResponse.builder()
                        .code(ex.getCode())
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(FamilyException.class)
    public ResponseEntity<ErrorResponse> handleFamilyException(FamilyException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .body(ErrorResponse.builder()
                        .code(ex.getCode())
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(TaskException.class)
    public ResponseEntity<ErrorResponse> handleTaskException(TaskException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .body(ErrorResponse.builder()
                        .code(ex.getCode())
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(HabitException.class)
    public ResponseEntity<ErrorResponse> handleHabitException(HabitException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .body(ErrorResponse.builder()
                        .code(ex.getCode())
                        .message(ex.getMessage())
                        .build());
    }

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
