package com.vertexdev.familytask.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vertexdev.familytask.dto.ai.*;
import com.vertexdev.familytask.exception.AiServiceUnavailableException;
import com.vertexdev.familytask.exception.AiSuggestionException;
import com.vertexdev.familytask.model.enums.SuggestionCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SuggestionService {

    private final OllamaChatModel chatModel;
    private final GamificationRules gamificationRules;
    private final MemberProfileResolver memberProfileResolver;
    private final ObjectMapper objectMapper;

    public SuggestionListResponse generate(Long familyId, String categoryStr, Long memberId) {
        SuggestionCategory category = parseCategory(categoryStr);
        MemberProfileResolver.MemberProfile profile = memberProfileResolver.resolve(familyId, memberId);

        String userPrompt = String.format(
                PromptTemplates.USER_PROMPT_TEMPLATE,
                profile.role(),
                profile.level(),
                formatCategory(category)
        );

        String rawJson = callModel(userPrompt);
        List<AiRawSuggestion> rawSuggestions = parseResponse(rawJson);

        if (rawSuggestions.isEmpty()) {
            return SuggestionListResponse.builder()
                    .sugerencias(List.of())
                    .mensaje("No se encontraron sugerencias para los criterios seleccionados.")
                    .categoria(category.name())
                    .build();
        }

        boolean isFamilyCategory = category == SuggestionCategory.RESPONSABILIDAD_FAMILIAR;
        List<SuggestionResponse> suggestions = rawSuggestions.stream()
                .map(raw -> mapToResponse(raw, isFamilyCategory))
                .toList();

        return SuggestionListResponse.builder()
                .sugerencias(suggestions)
                .categoria(category.name())
                .build();
    }

    private String callModel(String userPrompt) {
        try {
            var prompt = new Prompt(List.of(
                    new SystemMessage(PromptTemplates.SYSTEM_PROMPT),
                    new UserMessage(userPrompt)
            ));
            var response = chatModel.call(prompt);
            return response.getResult().getOutput().getText();
        } catch (AiSuggestionException e) {
            throw e;
        } catch (Exception e) {
            log.error("Ollama cloud call failed: {}", e.getMessage(), e);
            throw new AiServiceUnavailableException(
                    "El servicio de sugerencias no está disponible en este momento. Intenta de nuevo más tarde.", e);
        }
    }

    private List<AiRawSuggestion> parseResponse(String rawJson) {
        try {
            AiRawResponse parsed = objectMapper.readValue(rawJson, AiRawResponse.class);
            if (parsed == null || parsed.getSugerencias() == null) {
                return List.of();
            }
            return parsed.getSugerencias().stream()
                    .filter(s -> s.getNombre() != null && !s.getNombre().isBlank())
                    .toList();
        } catch (Exception e) {
            log.warn("Failed to parse AI response: {}", e.getMessage());
            return List.of();
        }
    }

    private SuggestionResponse mapToResponse(AiRawSuggestion raw, boolean isFamilyCategory) {
        String frecuencia = sanitizeFrecuencia(raw.getFrecuencia());
        String complejidad = sanitizeComplejidad(raw.getComplejidad());

        return SuggestionResponse.builder()
                .id(UUID.randomUUID().toString())
                .nombre(truncate(raw.getNombre(), 100))
                .descripcion(truncate(raw.getDescripcion(), 500))
                .tipo(sanitizeTipo(raw.getTipo()))
                .frecuencia(frecuencia)
                .complejidad(complejidad)
                .puntos(gamificationRules.calculateCoins(complejidad))
                .exp(gamificationRules.calculateXp(complejidad, frecuencia, isFamilyCategory))
                .mensajeMotivador(raw.getMensajeMotivador())
                .build();
    }

    private SuggestionCategory parseCategory(String value) {
        try {
            return SuggestionCategory.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AiSuggestionException("INVALID_CATEGORY",
                    "Selecciona una categoría para recibir sugerencias.", 400);
        }
    }

    private String formatCategory(SuggestionCategory category) {
        return category.name().replace('_', ' ');
    }

    private String sanitizeFrecuencia(String value) {
        if (value == null) return "DAILY";
        return switch (value.trim().toUpperCase()) {
            case "DAILY", "WEEKLY", "WEEKDAYS", "WEEKENDS", "MONTHLY" -> value.trim().toUpperCase();
            default -> "DAILY";
        };
    }

    private String sanitizeComplejidad(String value) {
        if (value == null) return "Baja";
        return switch (value.trim().toLowerCase()) {
            case "baja" -> "Baja";
            case "media" -> "Media";
            case "alta" -> "Alta";
            default -> "Baja";
        };
    }

    private String sanitizeTipo(String value) {
        if (value == null) return "tarea";
        return switch (value.trim().toLowerCase()) {
            case "habito", "hábito" -> "habito";
            default -> "tarea";
        };
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return "";
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
