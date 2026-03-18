package com.vertexdev.familytask.exception;

public class FamilyException extends RuntimeException {

    private final String code;
    private final int httpStatus;

    public FamilyException(String code, String message, int httpStatus) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }

    public String getCode() { return code; }
    public int getHttpStatus() { return httpStatus; }
}
