package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.exception.RewardException;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Reward;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.ApprovalRule;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.RewardRepository;
import com.vertexdev.familytask.util.FamilyPermissions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RewardServiceDeleteTest {

    @Mock private RewardRepository rewardRepository;
    @Mock private FamilyMemberRepository familyMemberRepository;
    @Mock private FamilyPermissions familyPermissions;
    @InjectMocks private RewardService rewardService;

    private User parent;
    private FamilyGroup family;
    private Reward reward;
    private FamilyMember parentMember;

    @BeforeEach
    void setUp() {
        parent = new User();
        parent.setId(1L);
        parent.setEmail("parent@test.com");

        family = new FamilyGroup();
        family.setId(10L);
        family.setName("Test Family");

        reward = Reward.builder()
                .id(100L)
                .name("Old Name")
                .description("Old Desc")
                .icon("cake")
                .cost(50)
                .minLevel(null)
                .approvalRule(ApprovalRule.MANUAL)
                .familyGroup(family)
                .isActive(true)
                .build();

        parentMember = new FamilyMember();
    }

    @Test
    void deleteReward_success_setsIsActiveFalseAndReturnsMessage() {
        assertThat(reward.getIsActive()).isTrue(); // confirm initial state

        when(rewardRepository.findById(100L)).thenReturn(Optional.of(reward));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(parentMember));
        when(familyPermissions.isActiveParent(parentMember)).thenReturn(true);

        MessageResponse response = rewardService.deleteReward(100L, parent);

        assertThat(reward.getIsActive()).isFalse();
        verify(rewardRepository).save(reward);
        assertThat(response.getMessage()).isEqualTo("Recompensa eliminada correctamente.");
    }

    @Test
    void deleteReward_rewardNotFound_throwsRewardException() {
        when(rewardRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rewardService.deleteReward(999L, parent))
                .isInstanceOf(RewardException.class)
                .hasMessage("Recompensa no encontrada.")
                .extracting("httpStatus").isEqualTo(404);
    }

    @Test
    void deleteReward_inactiveReward_throwsNotFound() {
        reward.setIsActive(false);
        when(rewardRepository.findById(100L)).thenReturn(Optional.of(reward));

        assertThatThrownBy(() -> rewardService.deleteReward(100L, parent))
                .isInstanceOf(RewardException.class)
                .extracting("code").isEqualTo("REWARD_NOT_FOUND");
    }

    @Test
    void deleteReward_notParent_throwsAccessDenied() {
        when(rewardRepository.findById(100L)).thenReturn(Optional.of(reward));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(parentMember));
        when(familyPermissions.isActiveParent(parentMember)).thenReturn(false);

        assertThatThrownBy(() -> rewardService.deleteReward(100L, parent))
                .isInstanceOf(RewardException.class)
                .hasMessage("Acceso no autorizado.")
                .extracting("code").isEqualTo("ACCESS_DENIED");
    }
}
