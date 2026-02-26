package com.vertexdev.familytask.service;

import com.vertexdev.familytask.dto.LoginResponse;
import com.vertexdev.familytask.model.User;
import com.vertexdev.familytask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Obtiene el usuario actualmente autenticado desde el contexto de Spring Security.
     */
    public LoginResponse.UserInfo getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        return mapToUserInfo(currentUser);
    }

    /**
     * Lista todos los users
     */
    public List<LoginResponse.UserInfo> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserInfo)
                .toList();
    }

    /**
     * Mapea la entidad User al DTO UserInfo.
     */
    private LoginResponse.UserInfo mapToUserInfo(User user) {
        return LoginResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .pictureUrl(user.getPictureUrl())
                .role(user.getRole().getName().name())
                .build();
    }
}
