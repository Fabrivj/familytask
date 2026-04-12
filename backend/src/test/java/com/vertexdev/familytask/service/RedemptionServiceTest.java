package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.redemption.RedemptionHistoryResponse;
import com.vertexdev.familytask.exception.RedemptionException;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.RedemptionRequest;
import com.vertexdev.familytask.model.Reward;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.RedemptionStatus;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.RedemptionRepository;
import com.vertexdev.familytask.repository.RewardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RedemptionServiceTest {

    @Mock private FamilyGroupRepository familyGroupRepository;
    @Mock private FamilyMemberRepository familyMemberRepository;
    @Mock private RewardRepository rewardRepository;
    @Mock private RedemptionRepository redemptionRepository;
    @InjectMocks private RedemptionService redemptionService;

    private User user;
    private FamilyGroup family;
    private FamilyMember member;
    private Reward reward;
    private RedemptionRequest redemption;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("Ana Garcia");

        family = new FamilyGroup();
        family.setId(10L);
        family.setName("Garcia Family");

        member = new FamilyMember();
        member.setFamilyGroup(family);
        member.setUser(user);
        member.setIsActive(true);

        reward = new Reward();
        reward.setId(55L);
        reward.setName("Pizza");
        reward.setIcon("gift");
        reward.setCost(50);
        reward.setFamilyGroup(family);

        redemption = RedemptionRequest.builder()
                .id(100L)
                .reward(reward)
                .requestedBy(member)
                .familyGroup(family)
                .coinsSpent(50)
                .status(RedemptionStatus.PENDING)
                .requestedAt(LocalDateTime.of(2026, 3, 1, 10, 0))
                .build();
    }

    @Test
    void getHistory_noFilters_returnsAllFamilyRedemptions() {
        when(familyGroupRepository.findById(10L)).thenReturn(Optional.of(family));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(member));
        when(redemptionRepository.findHistory(eq(10L), isNull(), isNull(),
                eq(LocalDateTime.of(1900, 1, 1, 0, 0, 0)),
                eq(LocalDateTime.of(2099, 12, 31, 23, 59, 59))))
                .thenReturn(List.of(redemption));

        List<RedemptionHistoryResponse> result =
                redemptionService.getHistory(10L, null, null, null, null, user);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRewardName()).isEqualTo("Pizza");
        assertThat(result.get(0).getRewardCost()).isEqualTo(50);
        assertThat(result.get(0).getRewardIcon()).isEqualTo("gift");
        assertThat(result.get(0).getStatus()).isEqualTo(RedemptionStatus.PENDING);
        assertThat(result.get(0).getRedeemedByName()).isEqualTo("Ana Garcia");
        assertThat(result.get(0).getRedeemedByUserId()).isEqualTo(1L);
    }

    @Test
    void getHistory_withStatusFilter_forwardsFilterToRepository() {
        when(familyGroupRepository.findById(10L)).thenReturn(Optional.of(family));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(member));
        when(redemptionRepository.findHistory(eq(10L), isNull(), eq("DELIVERED"),
                eq(LocalDateTime.of(1900, 1, 1, 0, 0, 0)), eq(LocalDateTime.of(2099, 12, 31, 23, 59, 59))))
                .thenReturn(List.of());

        List<RedemptionHistoryResponse> result =
                redemptionService.getHistory(10L, null, RedemptionStatus.DELIVERED, null, null, user);

        assertThat(result).isEmpty();
        verify(redemptionRepository).findHistory(eq(10L), isNull(), eq("DELIVERED"),
                eq(LocalDateTime.of(1900, 1, 1, 0, 0, 0)), eq(LocalDateTime.of(2099, 12, 31, 23, 59, 59)));
    }

    @Test
    void getHistory_withMemberFilter_forwardsFilterToRepository() {
        when(familyGroupRepository.findById(10L)).thenReturn(Optional.of(family));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(member));
        when(redemptionRepository.findHistory(eq(10L), eq(2L), isNull(),
                eq(LocalDateTime.of(1900, 1, 1, 0, 0, 0)), eq(LocalDateTime.of(2099, 12, 31, 23, 59, 59))))
                .thenReturn(List.of());

        List<RedemptionHistoryResponse> result =
                redemptionService.getHistory(10L, 2L, null, null, null, user);

        assertThat(result).isEmpty();
        verify(redemptionRepository).findHistory(eq(10L), eq(2L), isNull(),
                eq(LocalDateTime.of(1900, 1, 1, 0, 0, 0)), eq(LocalDateTime.of(2099, 12, 31, 23, 59, 59)));
    }

    @Test
    void getHistory_withDateRange_convertsToStartAndEndOfDay() {
        LocalDate dateFrom = LocalDate.of(2026, 3, 1);
        LocalDate dateTo   = LocalDate.of(2026, 3, 31);

        when(familyGroupRepository.findById(10L)).thenReturn(Optional.of(family));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(member));
        when(redemptionRepository.findHistory(
                eq(10L), isNull(), isNull(),
                eq(dateFrom.atStartOfDay()),
                eq(dateTo.atTime(23, 59, 59))))
                .thenReturn(List.of(redemption));

        List<RedemptionHistoryResponse> result =
                redemptionService.getHistory(10L, null, null, dateFrom, dateTo, user);

        assertThat(result).hasSize(1);
        verify(redemptionRepository).findHistory(
                eq(10L), isNull(), isNull(),
                eq(dateFrom.atStartOfDay()),
                eq(dateTo.atTime(23, 59, 59)));
    }

    @Test
    void getHistory_familyNotFound_throwsRedemptionException() {
        when(familyGroupRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> redemptionService.getHistory(999L, null, null, null, null, user))
                .isInstanceOf(RedemptionException.class)
                .hasMessage("Familia no encontrada.")
                .extracting("httpStatus").isEqualTo(404);
    }

    @Test
    void getHistory_userNotMember_throwsAccessDenied() {
        when(familyGroupRepository.findById(10L)).thenReturn(Optional.of(family));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> redemptionService.getHistory(10L, null, null, null, null, user))
                .isInstanceOf(RedemptionException.class)
                .hasMessage("Acceso no autorizado.")
                .extracting("code").isEqualTo("ACCESS_DENIED");
    }

    @Test
    void getHistory_inactiveMember_throwsAccessDenied() {
        member.setIsActive(false);
        when(familyGroupRepository.findById(10L)).thenReturn(Optional.of(family));
        when(familyMemberRepository.findByFamilyGroupIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(member));

        assertThatThrownBy(() -> redemptionService.getHistory(10L, null, null, null, null, user))
                .isInstanceOf(RedemptionException.class)
                .extracting("code").isEqualTo("ACCESS_DENIED");
    }
}
