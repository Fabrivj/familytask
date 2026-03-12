package com.vertexdev.familytask.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Template for unit tests in this project.
 *
 * Annotations:
 *   @ExtendWith(MockitoExtension.class) — enables Mockito without loading Spring context
 *   @Mock                               — creates a mock of a dependency
 *   @InjectMocks                        — creates the class under test and injects the mocks
 *
 * To add a test:
 *   1. Declare the class under test with @InjectMocks
 *   2. Declare its dependencies with @Mock
 *   3. Write a method annotated with @Test
 *   4. Use when(...).thenReturn(...) to set up mock behavior
 *   5. Call the method and assert the result with assertThat(...)
 */
@ExtendWith(MockitoExtension.class)
class JwtUtilTest {

    @InjectMocks
    private JwtUtil jwtUtil;

    // @Test
    // void exampleTest() {
    //     // Arrange
    //     // ...
    //
    //     // Act
    //     // String result = jwtUtil.someMethod(...);
    //
    //     // Assert
    //     // assertThat(result).isNotNull();
    // }

}
