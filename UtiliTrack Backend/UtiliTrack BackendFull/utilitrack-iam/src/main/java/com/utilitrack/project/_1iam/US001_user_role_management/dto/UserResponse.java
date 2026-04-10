package com.utilitrack.project._1iam.US001_user_role_management.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private boolean enabled;
    private boolean forcePasswordChange;
    private Set<String> roles;
    private LocalDateTime createdAt;
}