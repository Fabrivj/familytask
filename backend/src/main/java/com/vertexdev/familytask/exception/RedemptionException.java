package com.vertexdev.familytask.exception;

public class RedemptionException extends RuntimeException {

    private final String code;
    private final int httpStatus;

    public RedemptionException(String code, String message, int httpStatus) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }

    public String getCode() { return code; }
    public int getHttpStatus() { return httpStatus; }
}
