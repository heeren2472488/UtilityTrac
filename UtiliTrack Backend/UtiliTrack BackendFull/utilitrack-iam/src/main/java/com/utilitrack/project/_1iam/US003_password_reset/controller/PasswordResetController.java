package com.utilitrack.project._1iam.US003_password_reset.controller;

import com.utilitrack.project._1iam.US003_password_reset.dto.ChangePasswordRequest;
import com.utilitrack.project._1iam.US003_password_reset.dto.ForgotPasswordRequest;
import com.utilitrack.project._1iam.US003_password_reset.dto.ResetPasswordRequest;
import com.utilitrack.project._1iam.US003_password_reset.service.PasswordResetService;
import com.utilitrack.project.common.ApiResponse;
import com.utilitrack.project.common.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/iam")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @Value("${app.expose-reset-token-in-response:false}")
    private boolean exposeResetTokenInResponse;

    /* =====================================================
       FORGOT PASSWORD
       ===================================================== */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest req) {

        try {
            String token = passwordResetService.requestReset(req);

            ResponseEntity.BodyBuilder response = ResponseEntity.ok();

            if (exposeResetTokenInResponse) {
                response.header("X-Dev-Reset-Token", token);
            }

            return response.body(
                    ApiResponse.ok("Password reset link sent successfully.")
            );

        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(ex.getMessage())
            );
        }
    }

    /* =====================================================
       RESET PASSWORD
       ===================================================== */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest req) {

        passwordResetService.resetPassword(req);

        return ResponseEntity.ok(
                ApiResponse.ok("Password reset successful. Please login with your new password.")
        );
    }

    /* =====================================================
       CHANGE PASSWORD
       ===================================================== */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest req,
            @AuthenticationPrincipal UserDetails currentUser) {

        passwordResetService.changePassword(req, currentUser.getUsername());

        return ResponseEntity.ok(
                ApiResponse.ok("Password changed successfully.")
        );
    }
}