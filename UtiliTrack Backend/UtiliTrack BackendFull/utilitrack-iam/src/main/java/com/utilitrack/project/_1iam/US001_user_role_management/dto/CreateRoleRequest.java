package com.utilitrack.project._1iam.US001_user_role_management.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class CreateRoleRequest {
    @NotBlank(message = "Role name is required")
    @Size(min=2, max=50)
    @Pattern(regexp="^[A-Z_]+$", message="Role name must be UPPERCASE letters and underscores only")
    private String name;
    @Size(max=255) private String description;
}
