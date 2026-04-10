package com.utilitrack.project._1iam.US002_secure_login.dto;

import lombok.*;
import java.util.Set;

/** US002: Login response with JWT token */
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class LoginResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private Set<String> roles;
    private boolean forcePasswordChange;
    private int remainingAttempts;
}
