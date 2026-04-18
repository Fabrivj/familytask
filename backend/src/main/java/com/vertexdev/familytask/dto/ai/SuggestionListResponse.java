package com.vertexdev.familytask.dto.ai;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SuggestionListResponse {
    private List<SuggestionResponse> sugerencias;
    private String mensaje;
    private String categoria;
}
