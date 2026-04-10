package com.utilitrack.project._1iam.US001_user_role_management.controller;

import com.utilitrack.project._1iam.US001_user_role_management.dto.AssignRolesRequest;
import com.utilitrack.project._1iam.US001_user_role_management.dto.CreateUserRequest;
import com.utilitrack.project._1iam.US001_user_role_management.dto.UserResponse;

import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.service.UserService;
import com.utilitrack.project.common.ApiResponse;
import com.utilitrack.project.common.PagedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/iam/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest req,
            @AuthenticationPrincipal User actor) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(userService.createUser(req, actor.getId(), actor.getEmail()), "User created"));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        return ResponseEntity.ok(ApiResponse.ok(
                userService.listUsers(search, PageRequest.of(page, size, Sort.by("createdAt").descending()))
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody CreateUserRequest req,
            @AuthenticationPrincipal User actor) {

        return ResponseEntity.ok(ApiResponse.ok(
                userService.updateUser(id, req, actor.getId(), actor.getEmail()),
                "User updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User actor) {

        userService.deleteUser(id, actor.getId(), actor.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("User deleted"));
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> assignRoles(
            @PathVariable Long id,
            @Valid @RequestBody AssignRolesRequest req,
            @AuthenticationPrincipal User actor) {

        return ResponseEntity.ok(ApiResponse.ok(
                userService.assignRoles(id, req, actor.getId(), actor.getEmail()),
                "Roles assigned"));
    }

    @DeleteMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> removeRoles(
            @PathVariable Long id,
            @Valid @RequestBody AssignRolesRequest req,
            @AuthenticationPrincipal User actor) {

        return ResponseEntity.ok(ApiResponse.ok(
                userService.removeRoles(id, req, actor.getId(), actor.getEmail()),
                "Roles removed"));
    }
}