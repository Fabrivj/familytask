package com.vertexdev.familytask.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.ReactorClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class OllamaCloudConfig {

    @Bean
    ObjectMapper objectMapper() {
        return new ObjectMapper()
                .findAndRegisterModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Bean
    OllamaApi ollamaApi(
            @Value("${app.ollama.base-url}") String baseUrl,
            @Value("${app.ollama.api-key}") String apiKey,
            @Value("${app.ollama.timeout-seconds:180}") int timeoutSeconds) {
        var httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(timeoutSeconds));
        var requestFactory = new ReactorClientHttpRequestFactory(httpClient);
        var restClientBuilder = RestClient.builder()
                .requestFactory(requestFactory)
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
            @Value("${app.ollama.temperature}") double temperature,
            @Value("${app.ollama.num-predict:600}") int numPredict) {
        return OllamaChatModel.builder()
                .ollamaApi(ollamaApi)
                .defaultOptions(OllamaChatOptions.builder()
                        .model(model)
                        .temperature(temperature)
                        .numPredict(numPredict)
                        .format("json")
                        .build())
                .build();
    }
}
