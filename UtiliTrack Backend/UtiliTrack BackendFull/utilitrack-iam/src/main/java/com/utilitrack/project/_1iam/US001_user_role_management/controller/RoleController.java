package com.utilitrack.project._1iam.US001_user_role_management.controller;

import com.utilitrack.project._1iam.US001_user_role_management.dto.CreateRoleRequest;
import com.utilitrack.project._1iam.US001_user_role_management.dto.RoleResponse;
import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.service.RoleService;
import com.utilitrack.project.common.ApiResponse;
import com.utilitrack.project.common.PagedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/iam/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(
            @Valid @RequestBody CreateRoleRequest req,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        roleService.createRole(req, actor.getId(), actor.getEmail()),
                        "Role created"));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<RoleResponse>>> listRoles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                roleService.listRoles(PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(roleService.getRoleById(id)));
    }
}
