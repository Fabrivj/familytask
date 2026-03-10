package com.vertexdev.familytask.mapper;

import com.vertexdev.familytask.dto.invitacion.InvitacionResponse;
import com.vertexdev.familytask.model.Invitacion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InvitacionMapper {

    // El linkInvitacion lo construye el service, no viene directo del modelo
    @Mapping(target = "rol", expression = "java(invitacion.getRol().name())")
    @Mapping(target = "linkInvitacion", ignore = true)
    InvitacionResponse toResponse(Invitacion invitacion);
}