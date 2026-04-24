package com.vertexdev.familytask.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vertexdev.familytask.dto.ai.AiRawResponse;
import com.vertexdev.familytask.dto.ai.AiRawSuggestion;
import com.vertexdev.familytask.dto.ai.SuggestionListResponse;
import com.vertexdev.familytask.dto.ai.SuggestionResponse;
import com.vertexdev.familytask.exception.AiServiceUnavailableException;
import com.vertexdev.familytask.exception.AiSuggestionException;
import com.vertexdev.familytask.model.enums.SuggestionCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SuggestionService {

    private final OllamaApi ollamaApi;
    private final GamificationRules gamificationRules;
    private final MemberProfileResolver memberProfileResolver;
    private final ObjectMapper objectMapper;

    @Value("${app.ollama.models:${app.ollama.model:minimax-m2.7:cloud}}")
    private String configuredModels;

    @Value("${app.ollama.temperature}")
    private double temperature;

    @Value("${app.ollama.num-predict:600}")
    private int numPredict;

    @Value("${app.ollama.parallel-wait-ms:12000}")
    private long parallelWaitMs;

    private static final String EMPTY_RESPONSE_DETAIL = "empty_response";

    public SuggestionListResponse generate(Long familyId,
                                           String categoryStr,
                                           Long memberId,
                                           List<String> excludedSuggestionNames) {
        SuggestionCategory category = parseCategory(categoryStr);
        MemberProfileResolver.MemberProfile profile = memberProfileResolver.resolve(familyId, memberId);
        Set<String> excludedKeys = normalizeSuggestions(excludedSuggestionNames);
        List<String> models = getConfiguredModels();

        List<AiRawSuggestion> rawSuggestions;
        if (models.size() == 1) {
            String model = models.getFirst();
            String userPrompt = buildUserPrompt(profile, category, excludedSuggestionNames, 0);
            rawSuggestions = callDefaultModelAll(model, userPrompt);
        } else
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<ModelCallTask> tasks = new ArrayList<>();
            for (int i = 0; i < models.size(); i++) {
                String model = models.get(i);
                String userPrompt = buildUserPrompt(profile, category, excludedSuggestionNames, i);
                AtomicReference<ModelCallMetrics> metricsRef = new AtomicReference<>();
                CompletableFuture<AiRawSuggestion> future = CompletableFuture.supplyAsync(
                        () -> callModelSingle(model, userPrompt, metricsRef),
                        executor
                );
                tasks.add(new ModelCallTask(model, future, metricsRef));
            }

            waitForBatch(tasks);

            Map<String, AiRawSuggestion> uniqueSuggestions = new LinkedHashMap<>();
            for (ModelCallTask task : tasks) {
                AiRawSuggestion suggestion = resolveCompletedSuggestion(task);
                if (!isValidSuggestion(suggestion)) {
                    continue;
                }

                String suggestionKey = buildSuggestionKey(suggestion);
                if (excludedKeys.contains(suggestionKey) || isTooSimilar(suggestion, uniqueSuggestions.values(), excludedKeys)) {
                    continue;
                }

                uniqueSuggestions.put(suggestionKey, suggestion);
            }

            rawSuggestions = List.copyOf(uniqueSuggestions.values());
        }

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

    private List<String> getConfiguredModels() {
        return List.of(configuredModels.split(",")).stream()
                .map(String::trim)
                .filter(model -> !model.isBlank())
                .toList();
    }

    private String buildUserPrompt(MemberProfileResolver.MemberProfile profile,
                                   SuggestionCategory category,
                                   List<String> excludedSuggestionNames,
                                    int promptIndex) {
        String variationHint = switch (promptIndex) {
            case 0 -> "\nRequirement: suggest a practical household TASK (tipo: tarea) with clear steps. Keep it realistic and achievable for the child's age. Focus on a DIFFERENT aspect of the category than typical cleaning.";
            case 1 -> "\nRequirement: suggest a DAILY or WEEKLY habit (tipo: habito) the child builds over time. Must be a different type of activity than the first suggestion — focus on a unique sub-area of the category.";
            default -> "\nRequirement: suggest a task or habit that is COLLABORATIVE or involves the whole family. Must cover a sub-area not yet addressed — avoid duplicating themes already common in the category.";
        };

        String prompt = PromptTemplates.USER_PROMPT_TEMPLATE.formatted(
                profile.role(),
                profile.level(),
                formatCategory(category)
        ) + variationHint;

        if (excludedSuggestionNames == null || excludedSuggestionNames.isEmpty()) {
            return prompt;
        }

        String excludedBlock = excludedSuggestionNames.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(String::trim)
                .distinct()
                .map(name -> "- " + name)
                .collect(Collectors.joining("\n"));

        if (excludedBlock.isBlank()) {
            return prompt;
        }

        return prompt + "\nEvita repetir o reformular estas sugerencias:\n" + excludedBlock;
    }

    private void waitForBatch(List<ModelCallTask> tasks) {
        CompletableFuture<?>[] futures = tasks.stream()
                .map(ModelCallTask::future)
                .toArray(CompletableFuture[]::new);

        try {
            CompletableFuture.allOf(futures).get(parallelWaitMs, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            log.warn("Parallel suggestion batch timed out after {} ms", parallelWaitMs);
        }

        for (ModelCallTask task : tasks) {
            if (!task.future().isDone()) {
                boolean cancelled = task.future().cancel(true);
                log.warn("Cancelled slow suggestion call for model {} after batch timeout: {}", task.model(), cancelled);
            }
        }
    }

    private AiRawSuggestion resolveCompletedSuggestion(ModelCallTask task) {
        try {
            if (task.future().isCancelled()) {
                return null;
            }
            return task.future().getNow(null);
        } catch (Exception e) {
            log.warn("Parallel suggestion call failed for model {}: {}", task.model(), e.getMessage());
            return null;
        }
    }

    private AiRawSuggestion callModelSingle(String model, String userPrompt) {
        return callModelSingle(model, userPrompt, new AtomicReference<>());
    }

    private List<AiRawSuggestion> callDefaultModelAll(String model, String userPrompt) {
        long startedAt = System.nanoTime();
        try {
            log.info("Suggestion request model={} promptLength={}", model, userPrompt.length());

            // Explicit JSON format — not relying on injected bean defaults
            OllamaChatModel chatModel = OllamaChatModel.builder()
                    .ollamaApi(ollamaApi)
                    .defaultOptions(OllamaChatOptions.builder()
                            .model(model)
                            .temperature(temperature)
                            .numPredict(numPredict)
                            .format("json")
                            .build())
                    .build();

            var prompt = new Prompt(List.of(
                    new SystemMessage(PromptTemplates.SYSTEM_PROMPT_THREE),
                    new UserMessage(userPrompt)
            ));
            String rawJson = chatModel.call(prompt).getResult().getOutput().getText();
            if (rawJson == null || rawJson.isBlank()) {
                log.warn("Model {} returned an empty response after {} ms.", model, durationMs(startedAt));
                throw new AiServiceUnavailableException("El proveedor de sugerencias devolvió una respuesta vacía.",
                        new IllegalStateException(EMPTY_RESPONSE_DETAIL));
            }
            List<AiRawSuggestion> suggestions = parseResponse(rawJson);
            log.info("Suggestion model={} status=completed durationMs={} count={}", model, durationMs(startedAt), suggestions.size());
            return suggestions;
        } catch (AiServiceUnavailableException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Model {} failed after {} ms: {}", model, durationMs(startedAt), e.getMessage());
            throw new AiServiceUnavailableException(
                    "El servicio de sugerencias no está disponible en este momento. Intenta de nuevo más tarde.", e);
        }
    }

    private AiRawSuggestion callModelSingle(String model,
                                           String userPrompt,
                                           AtomicReference<ModelCallMetrics> metricsRef) {
        return callModelSingle(model, userPrompt, metricsRef, 0);
    }

    private AiRawSuggestion callModelSingle(String model,
                                           String userPrompt,
                                           AtomicReference<ModelCallMetrics> metricsRef,
                                           int attempt) {
        long startedAt = System.nanoTime();
        try {
            log.info("Suggestion request model={} promptLength={} attempt={}", model, userPrompt.length(), attempt);
            OllamaChatModel chatModel = OllamaChatModel.builder()
                    .ollamaApi(ollamaApi)
                    .defaultOptions(OllamaChatOptions.builder()
                            .model(model)
                            .temperature(temperature)
                            .numPredict(numPredict)
                            .format("json")
                            .build())
                    .build();

            var prompt = new Prompt(List.of(
                    new SystemMessage(PromptTemplates.SYSTEM_PROMPT_SINGLE),
                    new UserMessage(userPrompt)
            ));
            String rawJson = chatModel.call(prompt).getResult().getOutput().getText();
            metricsRef.set(ModelCallMetrics.completed(durationMs(startedAt), rawJson == null ? 0 : rawJson.length()));
            if (rawJson == null || rawJson.isBlank()) {
                throw new IllegalStateException(EMPTY_RESPONSE_DETAIL);
            }
            List<AiRawSuggestion> suggestions = parseResponse(rawJson);
            return suggestions.isEmpty() ? null : suggestions.getFirst();
        } catch (AiSuggestionException e) {
            metricsRef.set(ModelCallMetrics.failed(durationMs(startedAt), e.getClass().getSimpleName()));
            throw e;
        } catch (Exception e) {
            if (isEmptyResponseError(e)) {
                metricsRef.set(ModelCallMetrics.failed(durationMs(startedAt), EMPTY_RESPONSE_DETAIL));
                log.warn("Model {} returned an empty response after {} ms.", model, durationMs(startedAt));
                throw new AiServiceUnavailableException(
                        "El proveedor de sugerencias devolvió una respuesta vacía.", e);
            }
            if (attempt == 0) {
                log.warn("Model {} failed on first attempt after {} ms: {}. Retrying once.",
                        model, durationMs(startedAt), e.getMessage());
                return callModelSingle(
                        model,
                        userPrompt + "\nResponde con JSON corto y completo en una sola linea.",
                        metricsRef,
                        1
                );
            }
            metricsRef.set(ModelCallMetrics.failed(durationMs(startedAt), e.getClass().getSimpleName()));
            log.warn("Model {} failed after {} ms: {}", model, durationMs(startedAt), e.getMessage());
            throw new AiServiceUnavailableException(
                    "El servicio de sugerencias no está disponible en este momento. Intenta de nuevo más tarde.", e);
        } finally {
            ModelCallMetrics metrics = metricsRef.get();
            if (metrics != null) {
                log.info("Suggestion model={} status={} durationMs={} responseLength={} detail={}",
                        model,
                        metrics.status(),
                        metrics.durationMs(),
                        metrics.responseLength(),
                        metrics.detail());
            }
        }
    }

    private boolean isEmptyResponseError(Exception error) {
        return error instanceof IllegalStateException
                && EMPTY_RESPONSE_DETAIL.equals(error.getMessage());
    }

    private long durationMs(long startedAt) {
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
    }

    private boolean isValidSuggestion(AiRawSuggestion suggestion) {
        return suggestion != null
                && suggestion.getNombre() != null
                && !suggestion.getNombre().isBlank();
    }

    private Set<String> normalizeSuggestions(Collection<String> suggestionNames) {
        if (suggestionNames == null || suggestionNames.isEmpty()) {
            return Set.of();
        }

        return suggestionNames.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(this::normalizeText)
                .filter(text -> !text.isBlank())
                .collect(Collectors.toSet());
    }

    private String buildSuggestionKey(AiRawSuggestion suggestion) {
        String name = normalizeText(suggestion.getNombre());
        String description = normalizeText(suggestion.getDescripcion());
        return name + "|" + description;
    }

    private boolean isTooSimilar(AiRawSuggestion candidate,
                                 Collection<AiRawSuggestion> acceptedSuggestions,
                                 Set<String> excludedKeys) {
        String candidateKey = buildSuggestionKey(candidate);
        Set<String> candidateTokens = tokenize(candidateKey);

        for (String excludedKey : excludedKeys) {
            if (similarityScore(candidateTokens, tokenize(excludedKey)) >= 0.6) {
                return true;
            }
        }

        for (AiRawSuggestion acceptedSuggestion : acceptedSuggestions) {
            String acceptedKey = buildSuggestionKey(acceptedSuggestion);
            if (similarityScore(candidateTokens, tokenize(acceptedKey)) >= 0.6) {
                return true;
            }
        }

        return false;
    }

    private Set<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        Set<String> stopWords = Set.of(
                "de", "la", "el", "los", "las", "y", "a", "en", "un", "una",
                "para", "con", "al", "del", "por", "tu", "sus", "despues", "luego"
        );

        return List.of(value.split(" ")).stream()
                .map(String::trim)
                .filter(token -> token.length() > 2)
                .filter(token -> !stopWords.contains(token))
                .collect(Collectors.toCollection(HashSet::new));
    }

    private double similarityScore(Set<String> left, Set<String> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0.0;
        }

        Set<String> intersection = new HashSet<>(left);
        intersection.retainAll(right);

        Set<String> union = new HashSet<>(left);
        union.addAll(right);
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }

        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private List<AiRawSuggestion> parseResponse(String rawJson) {
        try {
            String json = stripMarkdownCodeBlock(rawJson);
            AiRawResponse parsed = objectMapper.readValue(json, AiRawResponse.class);
            if (parsed == null || parsed.getSugerencias() == null) {
                return List.of();
            }
            return parsed.getSugerencias().stream()
                    .filter(s -> s.getNombre() != null && !s.getNombre().isBlank())
                    .toList();
        } catch (Exception e) {
            log.warn("Failed to parse AI response: {}", e.getMessage());
            throw new IllegalStateException("Invalid AI JSON response", e);
        }
    }

    private String stripMarkdownCodeBlock(String text) {
        if (text == null) return "";
        String trimmed = text.strip();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline != -1) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.lastIndexOf("```")).strip();
            }
        }
        return trimmed;
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
                .monedas(gamificationRules.calculateCoins(complejidad))
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

    private record ModelCallTask(
            String model,
            CompletableFuture<AiRawSuggestion> future,
            AtomicReference<ModelCallMetrics> metricsRef
    ) {}

    private record ModelCallMetrics(
            String status,
            long durationMs,
            int responseLength,
            String detail
    ) {
        static ModelCallMetrics completed(long durationMs, int responseLength) {
            return new ModelCallMetrics("completed", durationMs, responseLength, "");
        }

        static ModelCallMetrics failed(long durationMs, String detail) {
            return new ModelCallMetrics("failed", durationMs, 0, detail);
        }
    }
}
