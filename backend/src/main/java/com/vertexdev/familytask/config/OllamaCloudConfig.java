package com.vertexdev.familytask.config;

import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;

@Configuration
public class OllamaCloudConfig {

    @Bean
    OllamaApi ollamaApi(
            @Value("${app.ollama.base-url}") String baseUrl,
            @Value("${app.ollama.api-key}") String apiKey) {
        var restClientBuilder = RestClient.builder()
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
        return OllamaApi.builder()
                .baseUrl(baseUrl)
                .restClientBuilder(restClientBuilder)
                .build();
    }

    @Bean
    OllamaChatModel ollamaChatModel(
            OllamaApi ollamaApi,
            @Value("${app.ollama.model}") String model,
            @Value("${app.ollama.temperature}") double temperature) {
        return OllamaChatModel.builder()
                .ollamaApi(ollamaApi)
                .defaultOptions(OllamaChatOptions.builder()
                        .model(model)
                        .temperature(temperature)
                        .format("json")
                        .build())
                .build();
    }
}
