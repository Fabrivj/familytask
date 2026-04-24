package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.task.CreateTaskRequest;
import com.vertexdev.familytask.dto.task.TaskResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

    @Mock private TaskService taskService;
    @InjectMocks private TaskController taskController;

    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .email("padre@familia.com")
                .name("Padre Test")
                .googleId("google-123")
                .build();
    }

    @Test
    void getTasks_returnsOk_withTaskListFromService() {
        List<TaskResponse> expectedTasks = List.of(
                TaskResponse.builder().id(1L).title("Limpiar cocina").status("PENDING").build(),
                TaskResponse.builder().id(2L).title("Barrer patio").status("IN_PROGRESS").build()
        );
        when(taskService.getTasks(10L, authenticatedUser)).thenReturn(expectedTasks);

        ResponseEntity<List<TaskResponse>> response = taskController.getTasks(10L, authenticatedUser);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getTitle()).isEqualTo("Limpiar cocina");
        verify(taskService).getTasks(10L, authenticatedUser);
    }

    @Test
    void createTask_returnsCreated_withNewTask() {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setFamilyId(10L);
        request.setTitle("Nueva tarea");
        TaskResponse created = TaskResponse.builder().id(5L).title("Nueva tarea").build();
        when(taskService.createTask(request, authenticatedUser)).thenReturn(created);

        ResponseEntity<TaskResponse> response = taskController.createTask(request, authenticatedUser);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getId()).isEqualTo(5L);
        assertThat(response.getBody().getTitle()).isEqualTo("Nueva tarea");
        verify(taskService).createTask(request, authenticatedUser);
    }

    @Test
    void deleteTask_returnsOk_withConfirmationMessage() {
        MessageResponse message = new MessageResponse("Tarea eliminada correctamente.");
        when(taskService.deleteTask(3L, authenticatedUser)).thenReturn(message);

        ResponseEntity<MessageResponse> response = taskController.deleteTask(3L, authenticatedUser);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getMessage()).isEqualTo("Tarea eliminada correctamente.");
        verify(taskService).deleteTask(3L, authenticatedUser);
    }
}
