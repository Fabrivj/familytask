package com.vertexdev.familytask.exception;

public class AiServiceUnavailableException extends RuntimeException {

    private final String code;

    public AiServiceUnavailableException(String message) {
        super(message);
        this.code = "AI_SERVICE_UNAVAILABLE";
    }

    public AiServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
        this.code = "AI_SERVICE_UNAVAILABLE";
    }

    public String getCode() { return code; }
}
