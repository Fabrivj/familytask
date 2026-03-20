package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.family.UpdateRoleRequest;
import com.vertexdev.familytask.exception.FamilyException;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.InvitationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FamilyGroupServiceTest {

    @Mock
    private FamilyGroupRepository familyGroupRepository;

    @Mock
    private FamilyMemberRepository familyMemberRepository;

    @Mock
    private InvitationRepository invitationRepository;

    @InjectMocks
    private FamilyGroupService familyGroupService;

    private User requester;
    private User targetUser;
    private FamilyGroup family;
    private FamilyMember requesterMember;
    private FamilyMember targetMember;

    @BeforeEach
    void setUp() {
        requester = User.builder().id(1L).email("admin@test.com").name("Admin").googleId("g1").build();
        targetUser = User.builder().id(2L).email("child@test.com").name("Child").googleId("g2").build();
        family = FamilyGroup.builder().id(10L).name("Test Family").build();

        requesterMember = FamilyMember.builder()
                .id(100L).familyGroup(family).user(requester)
                .role(Role.PARENT).isActive(true).isAdmin(true).build();

        targetMember = FamilyMember.builder()
                .id(101L).familyGroup(family).user(targetUser)
                .role(Role.CHILD).isActive(true).isAdmin(false).build();
    }

    @Test
    void updateMemberRole_childToParent_success() {
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(requesterMember));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 2L))
                .thenReturn(Optional.of(targetMember));

        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setRole(Role.PARENT);

        MessageResponse response = familyGroupService.updateMemberRole(10L, 2L, request, requester);

        assertThat(response.getMessage()).isEqualTo("Rol actualizado exitosamente.");
        assertThat(targetMember.getRole()).isEqualTo(Role.PARENT);
        verify(familyMemberRepository).save(targetMember);
    }

    @Test
    void updateMemberRole_parentToChild_withMultipleParents_success() {
        targetMember.setRole(Role.PARENT);

        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(requesterMember));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 2L))
                .thenReturn(Optional.of(targetMember));
        when(familyMemberRepository.countByFamilyGroupIdAndRoleAndIsActiveTrue(10L, Role.PARENT))
                .thenReturn(2L);

        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setRole(Role.CHILD);

        MessageResponse response = familyGroupService.updateMemberRole(10L, 2L, request, requester);

        assertThat(response.getMessage()).isEqualTo("Rol actualizado exitosamente.");
        assertThat(targetMember.getRole()).isEqualTo(Role.CHILD);
        verify(familyMemberRepository).save(targetMember);
    }

    @Test
    void updateMemberRole_lastParent_throws409() {
        targetMember.setRole(Role.PARENT);

        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(requesterMember));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 2L))
                .thenReturn(Optional.of(targetMember));
        when(familyMemberRepository.countByFamilyGroupIdAndRoleAndIsActiveTrue(10L, Role.PARENT))
                .thenReturn(1L);

        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setRole(Role.CHILD);

        assertThatThrownBy(() -> familyGroupService.updateMemberRole(10L, 2L, request, requester))
                .isInstanceOf(FamilyException.class)
                .hasMessage("Debe existir al menos un Padre/Tutor en la familia.");
    }

    @Test
    void updateMemberRole_nonAdminRequester_throws403() {
        requesterMember.setIsAdmin(false);

        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(requesterMember));

        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setRole(Role.PARENT);

        assertThatThrownBy(() -> familyGroupService.updateMemberRole(10L, 2L, request, requester))
                .isInstanceOf(FamilyException.class)
                .hasMessage("No tienes permisos para cambiar roles en esta familia.");
    }

    @Test
    void updateMemberRole_inactiveMember_throws400() {
        targetMember.setIsActive(false);

        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(requesterMember));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 2L))
                .thenReturn(Optional.of(targetMember));

        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setRole(Role.PARENT);

        assertThatThrownBy(() -> familyGroupService.updateMemberRole(10L, 2L, request, requester))
                .isInstanceOf(FamilyException.class)
                .hasMessage("No se puede cambiar el rol de un miembro inactivo.");
    }

    @Test
    void updateMemberRole_memberNotFound_throws404() {
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(requesterMember));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 999L))
                .thenReturn(Optional.empty());

        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setRole(Role.PARENT);

        assertThatThrownBy(() -> familyGroupService.updateMemberRole(10L, 999L, request, requester))
                .isInstanceOf(FamilyException.class)
                .hasMessage("Miembro no encontrado.");
    }

    @Test
    void updateMemberRole_sameRole_noOp() {
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(requesterMember));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 2L))
                .thenReturn(Optional.of(targetMember));

        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setRole(Role.CHILD); // target is already CHILD

        MessageResponse response = familyGroupService.updateMemberRole(10L, 2L, request, requester);

        assertThat(response.getMessage()).isEqualTo("Rol actualizado exitosamente.");
        verify(familyMemberRepository, never()).save(any());
    }
}
