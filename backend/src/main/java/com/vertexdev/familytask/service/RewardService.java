package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.MessageResponse;
import com.vertexdev.familytask.dto.reward.CreateRewardRequest;
import com.vertexdev.familytask.dto.reward.RewardResponse;
import com.vertexdev.familytask.exception.RewardException;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Reward;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.RewardRepository;
import com.vertexdev.familytask.util.FamilyPermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RewardService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final RewardRepository rewardRepository;
    private final FamilyPermissions familyPermissions;

    @Transactional
    public RewardResponse createReward(CreateRewardRequest request, User creator) {
        FamilyGroup familyGroup = familyGroupRepository.findById(request.getFamilyId())
                .orElseThrow(() -> new RewardException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), creator.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new RewardException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        try {
            Reward reward = Reward.builder()
                    .familyGroup(familyGroup)
                    .createdBy(creator)
                    .name(request.getName().trim())
                    .description(request.getDescription() != null ? request.getDescription().trim() : null)
                    .icon(request.getIcon())
                    .cost(request.getCost())
                    .minLevel(request.getMinLevel())
                    .build();

            rewardRepository.save(reward);
            log.info("Reward '{}' created by user {} in family {}", reward.getName(), creator.getEmail(), familyGroup.getName());

            return toResponse(reward);
        } catch (RewardException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating reward: {}", e.getMessage());
            throw new RewardException("REWARD_CREATION_FAILED", "No se pudo crear la recompensa. Intenta de nuevo.", 500);
        }
    }

    @Transactional(readOnly = true)
    public List<RewardResponse> getRewards(Long familyId, User requester) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyId)
                .orElseThrow(() -> new RewardException("FAMILY_NOT_FOUND", "Familia no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(familyGroup.getId(), requester.getId())
                .filter(FamilyMember::getIsActive)
                .orElseThrow(() -> new RewardException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        try {
            return rewardRepository.findByFamilyGroupIdAndIsActiveTrueOrderByCreatedAtDesc(familyGroup.getId())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch rewards for family {}: {}", familyId, e.getMessage());
            throw new RewardException("FETCH_FAILED", "Error al cargar las recompensas. Por favor, intente nuevamente.", 500);
        }
    }

    @Transactional
    public MessageResponse deleteReward(Long rewardId, User requester) {
        Reward reward = rewardRepository.findById(rewardId)
                .filter(r -> Boolean.TRUE.equals(r.getIsActive()))
                .orElseThrow(() -> new RewardException("REWARD_NOT_FOUND", "Recompensa no encontrada.", 404));

        familyMemberRepository
                .findByFamilyGroupIdAndUserId(reward.getFamilyGroup().getId(), requester.getId())
                .filter(familyPermissions::isActiveParent)
                .orElseThrow(() -> new RewardException("ACCESS_DENIED", "Acceso no autorizado.", 403));

        reward.setIsActive(false);
        rewardRepository.save(reward);
        log.info("Reward '{}' deleted by user {}", reward.getName(), requester.getEmail());
        return new MessageResponse("Recompensa eliminada correctamente.");
    }

    private RewardResponse toResponse(Reward reward) {
        return RewardResponse.builder()
                .id(reward.getId())
                .name(reward.getName())
                .description(reward.getDescription())
                .icon(reward.getIcon())
                .cost(reward.getCost())
                .minLevel(reward.getMinLevel())
                .familyId(reward.getFamilyGroup().getId())
                .createdAt(reward.getCreatedAt())
                .build();
    }
}
