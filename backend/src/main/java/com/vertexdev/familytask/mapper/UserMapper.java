package com.vertexdev.familytask.mapper;

import com.vertexdev.familytask.dto.auth.AuthResponse;
import com.vertexdev.familytask.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    /**
     * Maps a User entity to an AuthResponse DTO.
     *
     * The {@code token} and {@code families} fields are not present on the User
     * entity; callers must populate them after mapping via the respective setters.
     */
    @Mapping(target = "token", ignore = true)
    @Mapping(target = "families", ignore = true)
    AuthResponse toAuthResponse(User user);
}
