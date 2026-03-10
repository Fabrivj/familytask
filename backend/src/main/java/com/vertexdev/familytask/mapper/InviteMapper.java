package com.vertexdev.familytask.mapper;

import com.vertexdev.familytask.dto.invite.InviteResponse;
import com.vertexdev.familytask.model.Invitation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InviteMapper {

    // El linkInvitacion lo construye el service, no viene directo del modelo
    @Mapping(target = "role", expression = "java(invitation.getRole().name())")
    @Mapping(target = "inviteLink", ignore = true)
    InviteResponse toResponse(Invitation invitation);
}