package com.utilitrack.project._1iam.US003_password_reset.service;

import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.repository.UserRepository;
import com.utilitrack.project._1iam.US001_user_role_management.service.AuditService;
import com.utilitrack.project._1iam.US003_password_reset.dto.ChangePasswordRequest;
import com.utilitrack.project._1iam.US003_password_reset.dto.ForgotPasswordRequest;
import com.utilitrack.project._1iam.US003_password_reset.dto.ResetPasswordRequest;
import com.utilitrack.project._1iam.US003_password_reset.repository.PasswordResetTokenRepository;
import com.utilitrack.project.common.ResourceNotFoundException;
import com.utilitrack.project.entity.PasswordResetToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${app.reset-token.expiry-minutes:30}")
    private int expiryMinutes;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /* =====================================================
       FORGOT PASSWORD (SEND RESET LINK)
       ===================================================== */
    @Transactional
    public String requestReset(ForgotPasswordRequest req) {

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Email not registered or invalid email address")
                );

        // ✅ Invalidate previous tokens
        tokenRepository.deleteByUser_Id(user.getId());

        String tokenValue = UUID.randomUUID().toString();

        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .token(tokenValue)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .used(false)
                .build();

        tokenRepository.save(token);

        String resetLink = frontendUrl.endsWith("/")
                ? frontendUrl + "reset-password?token=" + tokenValue
                : frontendUrl + "/reset-password?token=" + tokenValue;

        // ✅ Send email only to registered users
        emailService.sendResetEmail(user.getEmail(), user.getName(), resetLink);

        auditService.log(
                user.getId(),
                user.getEmail(),
                "PASSWORD_RESET_REQUESTED",
                "User#" + user.getEmail()
        );

        log.info("Password reset email sent to {}", user.getEmail());
        return tokenValue;
    }

    /* =====================================================
       RESET PASSWORD USING TOKEN
       ===================================================== */
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {

        PasswordResetToken token = tokenRepository.findByToken(req.getToken())
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid or expired reset token")
                );

        if (!token.isValid()) {
            throw new IllegalArgumentException("Token expired or already used");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setForcePasswordChange(false);
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        auditService.log(
                user.getId(),
                user.getEmail(),
                "PASSWORD_RESET",
                "User#" + user.getEmail()
        );

        log.info("Password reset successful for {}", user.getEmail());
    }

    /* =====================================================
       CHANGE PASSWORD (AUTHENTICATED USER)
       ===================================================== */
    @Transactional
    public void changePassword(ChangePasswordRequest req, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found")
                );

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setForcePasswordChange(false);
        userRepository.save(user);

        auditService.log(
                user.getId(),
                user.getEmail(),
                "PASSWORD_CHANGED",
                "User#" + user.getEmail()
        );

        log.info("Password changed successfully for {}", user.getEmail());
    }
}