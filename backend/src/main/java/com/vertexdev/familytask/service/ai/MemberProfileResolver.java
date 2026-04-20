package com.vertexdev.familytask.service.ai;

import com.vertexdev.familytask.exception.AiSuggestionException;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MemberProfileResolver {

    private final FamilyMemberRepository familyMemberRepository;

    /**
     * Resolves the target member ensuring they belong to the given family and are active.
     * Returns only non-PII data needed for the AI prompt.
     */
    public MemberProfile resolve(Long familyId, Long memberId) {
        FamilyMember member = familyMemberRepository.findByFamilyGroupIdAndUserId(familyId, memberId)
                .filter(FamilyMember::getIsActive)
                .orElseThrow(() -> new AiSuggestionException(
                        "MEMBER_NOT_FOUND",
                        "El miembro seleccionado no pertenece a esta familia o no está activo.",
                        404));

        return new MemberProfile(
                member.getRole().name(),
                member.getCurrentLevel()
        );
    }

    public record MemberProfile(String role, int level) {}
}
