package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.reward.RewardResponse;
import com.vertexdev.familytask.dto.reward.UpdateRewardRequest;
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
class RewardServiceUpdateTest {

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
                .approvalRule(ApprovalRule.AUTOMATIC)
                .familyGroup(family)
                .isActive(true)
                .build();

        parentMember = new FamilyMember();
    }

    @Test
    void updateReward_success_updatesAllProvidedFields() {
        UpdateRewardRequest request = new UpdateRewardRequest();
        request.setName("New Name");
        request.setCost(200);
        request.setDescription(null);
        request.setMinLevel(null);
        request.setApprovalRule(ApprovalRule.MANUAL);
        request.setIcon("local_pizza");

        when(rewardRepository.findById(100L)).thenReturn(Optional.of(reward));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(parentMember));
        when(familyPermissions.isActiveParent(parentMember)).thenReturn(true);
        when(rewardRepository.save(reward)).thenReturn(reward);

        RewardResponse response = rewardService.updateReward(100L, request, parent);

        assertThat(response.getName()).isEqualTo("New Name");
        assertThat(response.getCost()).isEqualTo(200);
        assertThat(response.getDescription()).isNull();
        assertThat(response.getMinLevel()).isNull();
        assertThat(response.getApprovalRule()).isEqualTo(ApprovalRule.MANUAL);
        verify(rewardRepository).save(reward);
    }

    @Test
    void updateReward_rewardNotFound_throwsRewardException() {
        when(rewardRepository.findById(999L)).thenReturn(Optional.empty());

        UpdateRewardRequest request = new UpdateRewardRequest();
        request.setName("x");
        request.setCost(1);

        assertThatThrownBy(() -> rewardService.updateReward(999L, request, parent))
                .isInstanceOf(RewardException.class)
                .hasMessage("Recompensa no encontrada.")
                .extracting("httpStatus").isEqualTo(404);
    }

    @Test
    void updateReward_inactiveReward_throwsNotFound() {
        reward.setIsActive(false);
        when(rewardRepository.findById(100L)).thenReturn(Optional.of(reward));

        UpdateRewardRequest request = new UpdateRewardRequest();
        request.setName("x");
        request.setCost(1);

        assertThatThrownBy(() -> rewardService.updateReward(100L, request, parent))
                .isInstanceOf(RewardException.class)
                .extracting("code").isEqualTo("REWARD_NOT_FOUND");
    }

    @Test
    void updateReward_notParent_throwsAccessDenied() {
        when(rewardRepository.findById(100L)).thenReturn(Optional.of(reward));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(parentMember));
        when(familyPermissions.isActiveParent(parentMember)).thenReturn(false);

        UpdateRewardRequest request = new UpdateRewardRequest();
        request.setName("x");
        request.setCost(1);

        assertThatThrownBy(() -> rewardService.updateReward(100L, request, parent))
                .isInstanceOf(RewardException.class)
                .hasMessage("Acceso no autorizado.")
                .extracting("code").isEqualTo("ACCESS_DENIED");
    }

    @Test
    void updateReward_nullApprovalRule_respondsWithAutomatic() {
        UpdateRewardRequest request = new UpdateRewardRequest();
        request.setName("Test");
        request.setCost(10);
        request.setApprovalRule(null);
        reward.setApprovalRule(null);

        when(rewardRepository.findById(100L)).thenReturn(Optional.of(reward));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(parentMember));
        when(familyPermissions.isActiveParent(parentMember)).thenReturn(true);
        when(rewardRepository.save(reward)).thenReturn(reward);

        RewardResponse response = rewardService.updateReward(100L, request, parent);

        assertThat(response.getApprovalRule()).isEqualTo(ApprovalRule.AUTOMATIC);
    }
}
