package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.family.CreateFamilyRequest;
import com.vertexdev.familytask.dto.family.FamilyResponse;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.FamilyMember;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.model.enums.Role;
import com.vertexdev.familytask.repository.FamilyMemberRepository;
import com.vertexdev.familytask.repository.FamilyGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FamilyGroupService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyMemberRepository familyMemberRepository;

    @Transactional
    public FamilyResponse createFamily(CreateFamilyRequest request, User creator) {
        FamilyGroup familyGroup = FamilyGroup.builder()
                .name(request.getName())
                .build();

        familyGroupRepository.save(familyGroup);

        // Creator automatically becomes PARENT
        FamilyMember member = FamilyMember.builder()
                .familyGroup(familyGroup)
                .user(creator)
                .role(Role.PARENT)
                .isActive(true)
                .build();

        familyMemberRepository.save(member);
        log.info("Family '{}' created by {}", familyGroup.getName(), creator.getEmail());

        return FamilyResponse.builder()
                .id(familyGroup.getId())
                .name(familyGroup.getName())
                .role(Role.PARENT.name())
                .build();
    }
}