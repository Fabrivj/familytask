package com.vertexdev.familytask.exception;

public class AiSuggestionException extends RuntimeException {

    private final String code;
    private final int httpStatus;

    public AiSuggestionException(String code, String message, int httpStatus) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }

    public AiSuggestionException(String code, String message, int httpStatus, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.httpStatus = httpStatus;
    }

    public String getCode() { return code; }
    public int getHttpStatus() { return httpStatus; }
}
