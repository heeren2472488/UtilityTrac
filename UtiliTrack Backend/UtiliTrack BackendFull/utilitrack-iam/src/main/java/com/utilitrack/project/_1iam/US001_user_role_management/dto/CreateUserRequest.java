package com.utilitrack.project._1iam.US001_user_role_management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Set;

@Data
public class CreateUserRequest {

    @NotBlank
    private String name;

    @NotBlank @Email
    private String email;

    private String temporaryPassword;

    private Set<String> roleNames;
}
