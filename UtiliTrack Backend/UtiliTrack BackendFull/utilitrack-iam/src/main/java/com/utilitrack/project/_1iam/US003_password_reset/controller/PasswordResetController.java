package com.utilitrack.project._1iam.US003_password_reset.controller;

import com.utilitrack.project._1iam.US003_password_reset.dto.ChangePasswordRequest;
import com.utilitrack.project._1iam.US003_password_reset.dto.ForgotPasswordRequest;
import com.utilitrack.project._1iam.US003_password_reset.dto.ResetPasswordRequest;
import com.utilitrack.project._1iam.US003_password_reset.service.PasswordResetService;
import com.utilitrack.project.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * US003: Password Reset Controller
 *
 * ✅ POST /api/iam/forgot-password  (public)
 * ✅ POST /api/iam/reset-password   (public)
 * ✅ POST /api/iam/change-password  (authenticated)
 */
@RestController
@RequestMapping("/api/iam")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    /**
     * DEV‑ONLY option to expose reset token in response header
     * ⚠️ MUST be false in production
     */
    @Value("${app.expose-reset-token-in-response:false}")
    private boolean exposeResetTokenInResponse;

    /* =====================================================
       FORGOT PASSWORD (SEND RESET LINK)
       ===================================================== */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest req) {

        // Service returns token if email exists, otherwise null
        String tokenOrNull = passwordResetService.requestReset(req);

        String message = "If that email is registered, a reset link has been sent.";

        ResponseEntity.BodyBuilder response = ResponseEntity.ok();

        // ✅ DEV ONLY: attach token in response header
        if (exposeResetTokenInResponse && tokenOrNull != null) {
            response.header("X-Dev-Reset-Token", tokenOrNull);
        }

        return response.body(ApiResponse.ok(message));
    }

    /* =====================================================
       RESET PASSWORD USING TOKEN
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
       CHANGE PASSWORD (AUTHENTICATED USER)
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
