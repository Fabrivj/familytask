package com.vertexdev.familytask.dto.task;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateTaskStatusRequest {

    @NotBlank
    private String status;
}
