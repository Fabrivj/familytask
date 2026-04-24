package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.reward.CreateRewardRequest;
import com.vertexdev.familytask.dto.reward.RewardResponse;
import com.vertexdev.familytask.dto.reward.UpdateRewardRequest;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.ApprovalRule;
import com.vertexdev.familytask.service.RewardService;
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
class RewardControllerTest {

    @Mock private RewardService rewardService;
    @InjectMocks private RewardController rewardController;

    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .email("padre@familia.com")
                .name("Padre Test")
                .googleId("google-456")
                .build();
    }

    @Test
    void getRewards_returnsOk_withRewardListFromService() {
        List<RewardResponse> expectedRewards = List.of(
                RewardResponse.builder().id(1L).name("Pizza").cost(100).familyId(10L).build(),
                RewardResponse.builder().id(2L).name("Videojuego").cost(300).familyId(10L).build()
        );
        when(rewardService.getRewards(10L, authenticatedUser)).thenReturn(expectedRewards);

        ResponseEntity<List<RewardResponse>> response = rewardController.getRewards(10L, authenticatedUser);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getName()).isEqualTo("Pizza");
        verify(rewardService).getRewards(10L, authenticatedUser);
    }

    @Test
    void createReward_returnsCreated_withNewReward() {
        CreateRewardRequest request = new CreateRewardRequest();
        request.setFamilyId(10L);
        request.setName("Helado");
        request.setCost(50);
        RewardResponse created = RewardResponse.builder()
                .id(7L).name("Helado").cost(50).approvalRule(ApprovalRule.MANUAL).build();
        when(rewardService.createReward(request, authenticatedUser)).thenReturn(created);

        ResponseEntity<RewardResponse> response = rewardController.createReward(request, authenticatedUser);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getId()).isEqualTo(7L);
        assertThat(response.getBody().getName()).isEqualTo("Helado");
        verify(rewardService).createReward(request, authenticatedUser);
    }

    @Test
    void deleteReward_returnsOk_withConfirmationMessage() {
        MessageResponse message = new MessageResponse("Recompensa eliminada correctamente.");
        when(rewardService.deleteReward(2L, authenticatedUser)).thenReturn(message);

        ResponseEntity<MessageResponse> response = rewardController.deleteReward(2L, authenticatedUser);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getMessage()).isEqualTo("Recompensa eliminada correctamente.");
        verify(rewardService).deleteReward(2L, authenticatedUser);
    }
}
