package com.utilitrack.project._1iam.US001_user_role_management.service;

import com.utilitrack.project._1iam.US001_user_role_management.dto.*;

import com.utilitrack.project._1iam.US001_user_role_management.dto.CreateRoleRequest;
import com.utilitrack.project._1iam.US001_user_role_management.dto.RoleResponse;
import com.utilitrack.project._1iam.US001_user_role_management.entity.Role;
import com.utilitrack.project._1iam.US001_user_role_management.repository.RoleRepository;
import com.utilitrack.project.common.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * US001: Role creation and listing
 * - Idempotent: 409 on duplicate name (TEAM-51)
 * - Paginated listing (TEAM-51)
 */
@Service @RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final AuditService auditService;

    @Transactional
    public RoleResponse createRole(CreateRoleRequest req, Long actorId, String actorEmail) {
        String name = req.getName().toUpperCase();
        if (roleRepository.existsByName(name))
            throw new ConflictException("Role already exists: " + name);

        Role saved = roleRepository.save(Role.builder().name(name).description(req.getDescription()).build());
        auditService.log(actorId, actorEmail, "CREATE_ROLE", "Role#" + name,
                "{\"roleId\":" + saved.getId() + "}");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<RoleResponse> listRoles(Pageable pageable) {
        return PagedResponse.from(roleRepository.findAll(pageable), this::toResponse);
    }

    @Transactional(readOnly = true)
    public RoleResponse getRoleById(Long id) {
        return toResponse(roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + id)));
    }

    public RoleResponse toResponse(Role r) {
        return RoleResponse.builder().id(r.getId()).name(r.getName())
                .description(r.getDescription()).createdAt(r.getCreatedAt()).build();
    }
}
