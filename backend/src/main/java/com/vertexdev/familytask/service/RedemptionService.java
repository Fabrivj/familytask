package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.redemption.RedeemRewardRequest;
import com.vertexdev.familytask.dto.redemption.RedemptionHistoryResponse;
import com.vertexdev.familytask.dto.redemption.RedemptionResponse;
import com.vertexdev.familytask.exception.RedemptionException;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.RedemptionRequest;
import com.vertexdev.familytask.model.Reward;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.RedemptionStatus;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.RedemptionRepository;
import com.vertexdev.familytask.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedemptionService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final RewardRepository rewardRepository;
    private final RedemptionRepository redemptionRepository;

    @Transactional(readOnly = true)
    public List<RedemptionHistoryResponse> getHistory(
            Long familyId,
            Long memberId,
            RedemptionStatus status,
            LocalDate dateFrom,
            LocalDate dateTo,
            User requester) {

        familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new RedemptionException(
                        "FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(FamilyMember::getIsActive)
                .orElseThrow(() -> new RedemptionException(
                        "ACCESS_DENIED", "Acceso no autorizado.", 403));

        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : LocalDateTime.of(1900, 1, 1, 0, 0, 0);
        LocalDateTime to = dateTo != null ? dateTo.atTime(23, 59, 59) : LocalDateTime.of(2099, 12, 31, 23, 59, 59);

        try {
            String statusStr = status != null ? status.toString() : null;
            return redemptionRepository
                    .findHistory(
                            familyId,
                            memberId,
                            statusStr,
                            from,
                            to)
                    .stream()
                    .map(this::toHistoryResponse)
                    .toList();
        } catch (RedemptionException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch redemption history for family {}: {}", familyId, e.getMessage());
            throw new RedemptionException(
                    "FETCH_FAILED", "Error al cargar el historial de canjes.", 500);
        }
    }

    @Transactional
    public RedemptionResponse requestRedemption(RedeemRewardRequest request, User requester) {
        familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new RedemptionException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        FamilyMember member = familyMemberRepository
                .findByFamilyGroupIdAndUserId(request.getFamilyId(), requester.getId())
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()) && m.getRole() == Role.CHILD)
                .orElseThrow(() -> new RedemptionException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        Reward reward = rewardRepository.findById(request.getRewardId())
                .filter(r -> Boolean.TRUE.equals(r.getIsActive()))
                .orElseThrow(() -> new RedemptionException("REWARD_NOT_FOUND", "Recompensa no encontrada.", 404));

        if (member.getTotalCoins() < reward.getCost()) {
            throw new RedemptionException(
                    "INSUFFICIENT_COINS",
                    "No tienes monedas suficientes para canjear esta recompensa.",
                    400);
        }

        if (reward.getMinLevel() != null && member.getCurrentLevel() < reward.getMinLevel()) {
            throw new RedemptionException(
                    "LEVEL_NOT_MET",
                    "No alcanzas el nivel mínimo requerido para esta recompensa.",
                    400);
        }

        try {
            member.setTotalCoins(member.getTotalCoins() - reward.getCost());
            familyMemberRepository.save(member);

            RedemptionRequest redemption = RedemptionRequest.builder()
                    .reward(reward)
                    .requestedBy(member)
                    .familyGroup(reward.getFamilyGroup())
                    .coinsSpent(reward.getCost())
                    .build();

            RedemptionRequest saved = redemptionRepository.save(redemption);

            log.info("Redemption requested by user {} for reward '{}' in family {}",
                    requester.getEmail(), reward.getName(), reward.getFamilyGroup().getName());

            return toRedemptionResponse(saved);
        } catch (RedemptionException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing redemption for user {}: {}", requester.getEmail(), e.getMessage());
            throw new RedemptionException("REDEMPTION_FAILED", "No se pudo procesar el canje. Intenta de nuevo.", 500);
        }
    }

    @Transactional(readOnly = true)
    public List<RedemptionResponse> getMyRedemptions(Long familyId, User requester) {
        familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new RedemptionException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        FamilyMember member = familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyId, requester.getId())
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .orElseThrow(() -> new RedemptionException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        return redemptionRepository
                .findByFamilyGroupIdAndRequestedByIdOrderByRequestedAtDesc(familyId, member.getId())
                .stream()
                .map(this::toRedemptionResponse)
                .toList();
    }

    private RedemptionHistoryResponse toHistoryResponse(RedemptionRequest redemption) {
        return RedemptionHistoryResponse.builder()
                .id(redemption.getId())
                .rewardName(redemption.getReward().getName())
                .rewardIcon(redemption.getReward().getIcon())
                .rewardCost(redemption.getCoinsSpent())
                .redeemedByUserId(redemption.getRequestedBy().getUser().getId())
                .redeemedByName(redemption.getRequestedBy().getUser().getName())
                .status(redemption.getStatus())
                .redeemedAt(redemption.getRequestedAt())
                .build();
    }

    private RedemptionResponse toRedemptionResponse(RedemptionRequest redemption) {
        return RedemptionResponse.builder()
                .id(redemption.getId())
                .rewardId(redemption.getReward().getId())
                .rewardName(redemption.getReward().getName())
                .rewardIcon(redemption.getReward().getIcon())
                .coinsSpent(redemption.getCoinsSpent())
                .status(redemption.getStatus())
                .requestedAt(redemption.getRequestedAt())
                .build();
    }
}
