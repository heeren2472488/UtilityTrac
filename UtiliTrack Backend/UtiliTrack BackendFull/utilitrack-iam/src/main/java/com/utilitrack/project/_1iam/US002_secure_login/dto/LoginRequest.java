package com.utilitrack.project._1iam.US002_secure_login.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/** US002: Login request DTO */
@Data
public class LoginRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
