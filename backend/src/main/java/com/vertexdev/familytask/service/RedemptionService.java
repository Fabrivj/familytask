package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.redemption.RedeemRewardRequest;
import com.vertexdev.familytask.dto.redemption.RedemptionResponse;
import com.vertexdev.familytask.exception.RedemptionException;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.RedemptionRequest;
import com.vertexdev.familytask.model.Reward;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.RedemptionRepository;
import com.vertexdev.familytask.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedemptionService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final RewardRepository rewardRepository;
    private final RedemptionRepository redemptionRepository;

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

            return toResponse(saved);
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
                .map(this::toResponse)
                .toList();
    }

    private RedemptionResponse toResponse(RedemptionRequest redemption) {
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
