package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.task.CreateTaskRequest;
import com.vertexdev.familytask.exception.TaskException;
import com.vertexdev.familytask.mapper.TaskMapper;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.SpaceRepository;
import com.vertexdev.familytask.repository.TaskAssignmentRepository;
import com.vertexdev.familytask.repository.TaskRepository;
import com.vertexdev.familytask.repository.UserRepository;
import com.vertexdev.familytask.util.FamilyPermissions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private TaskAssignmentRepository taskAssignmentRepository;
    @Mock private FamilyGroupRepository familyGroupRepository;
    @Mock private FamilyMemberRepository familyMemberRepository;
    @Mock private SpaceRepository spaceRepository;
    @Mock private UserRepository userRepository;
    @Mock private TaskMapper taskMapper;
    @Mock private FamilyPermissions familyPermissions;

    @InjectMocks
    private TaskService taskService;

    // Test 5: un CHILD o un no padre no puede crear tareas
    @Test
    void createTask_throwsAccessDenied_whenCallerIsNotActiveParent() {
        FamilyGroup family = FamilyGroup.builder().id(1L).name("Familia Test").build();
        FamilyMember childMember = FamilyMember.builder()
                .role(Role.CHILD).isActive(true).build();
        User child = User.builder().id(1L).email("hijo@familia.com").build();

        when(familyGroupRepository.findById(1L)).thenReturn(Optional.of(family));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(childMember));
        when(familyPermissions.isActiveParent(childMember)).thenReturn(false);

        CreateTaskRequest request = new CreateTaskRequest();
        request.setFamilyId(1L);

        assertThatThrownBy(() -> taskService.createTask(request, child))
                .isInstanceOf(TaskException.class);
    }
}
