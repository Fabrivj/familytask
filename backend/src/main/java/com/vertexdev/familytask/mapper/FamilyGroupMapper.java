package com.vertexdev.familytask.mapper;

import com.vertexdev.familytask.dto.family.FamilyResponse;
import com.vertexdev.familytask.model.FamilyGroup;
import com.vertexdev.familytask.model.enums.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FamilyGroupMapper {

    /**
     * Maps a FamilyGroup entity to a FamilyResponse DTO.
     *
     * The {@code name} field is auto-mapped (same name in entity and DTO).
     * The {@code role} field is not present on FamilyGroup; callers must set it
     * after mapping via {@link FamilyResponse#setRole(String)}.
     */
    @Mapping(target = "role", ignore = true)
    FamilyResponse toResponse(FamilyGroup familyGroup);
}
