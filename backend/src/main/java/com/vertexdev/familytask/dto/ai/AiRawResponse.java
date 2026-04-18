package com.vertexdev.familytask.dto.ai;

import lombok.Data;

import java.util.List;

/**
 * Top-level wrapper for the JSON array returned by the LLM.
 */
@Data
public class AiRawResponse {
    private List<AiRawSuggestion> sugerencias;
}
