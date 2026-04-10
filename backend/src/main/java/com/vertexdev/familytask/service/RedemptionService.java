package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.redemption.RedemptionHistoryResponse;
import com.vertexdev.familytask.exception.RedemptionException;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.Redemption;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.RedemptionStatus;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.RedemptionRepository;
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

        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay()    : null;
        LocalDateTime to   = dateTo   != null ? dateTo.atTime(23, 59, 59)  : null;

        try {
            return redemptionRepository
                    .findHistory(familyId, memberId, status, from, to)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        } catch (RedemptionException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch redemption history for family {}: {}", familyId, e.getMessage());
            throw new RedemptionException(
                    "FETCH_FAILED", "Error al cargar el historial de canjes.", 500);
        }
    }

    private RedemptionHistoryResponse toResponse(Redemption r) {
        return RedemptionHistoryResponse.builder()
                .id(r.getId())
                .rewardName(r.getRewardName())
                .rewardIcon(r.getRewardIcon())
                .rewardCost(r.getRewardCost())
                .redeemedByUserId(r.getRedeemedBy().getId())
                .redeemedByName(r.getRedeemedBy().getName())
                .status(r.getStatus())
                .redeemedAt(r.getRedeemedAt())
                .build();
    }
}
