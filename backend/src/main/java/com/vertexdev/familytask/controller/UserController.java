package com.vertexdev.familytask.controller;

import com.vertexdev.familytask.dto.LoginResponse;
import com.vertexdev.familytask.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<LoginResponse.UserInfo> getAuthenticatedUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @GetMapping
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<List<LoginResponse.UserInfo>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}
