package com.utilitrack.project._1iam.US001_user_role_management.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.Set;

@Data
public class AssignRolesRequest {
    @NotEmpty
    private Set<String> roleNames;
}
