package com.utilitrack.project._1iam.US003_password_reset.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class ChangePasswordRequest {
    @NotBlank private String currentPassword;
    @NotBlank
    @Size(min=8, message="Password must be at least 8 characters")
    @Pattern(regexp="^(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+=!]).+$",
             message="Password must contain uppercase, number, and special character")
    private String newPassword;
}
