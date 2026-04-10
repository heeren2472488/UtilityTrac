package com.utilitrack.project._1iam.US003_password_reset.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * US003: Email service for password reset
 *
 * ✅ DEV mode  : logs reset link to console (no email sent)
 * ✅ PROD mode : sends real email via SMTP
 * ✅ Secure    : password is NEVER sent, only reset link
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * When true → email is NOT sent, only logged
     * Set in application.properties
     */
    @Value("${app.mail.dev-log-only:false}")
    private boolean devLogOnly;

    public void sendResetEmail(String toEmail, String name, String resetLink) {
        try {

            /* ================= DEV MODE ================= */
            if (devLogOnly) {
                log.info("DEV-ONLY EMAIL");
                log.info("To      : {}", toEmail);
                log.info("Subject : UtiliTrack - Password Reset");
                log.info("""
                        Body:
                        Hi %s,

                        You requested a password reset.

                        Reset link (valid 30 minutes):
                        %s

                        If you did not request this, ignore this email.
                        — UtiliTrack Security Team
                        """.formatted(name, resetLink));

                // Visible copy in console (easy for testing)
                System.out.println("\n========= RESET LINK (DEV ONLY) =========");
                System.out.println(resetLink);
                System.out.println("========================================\n");
                return;
            }

            /* ================= PROD MODE ================= */
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("heer.enjoy91@gmail.com");
            message.setSubject("UtiliTrack - Password Reset");
            message.setText("""
                Hi %s,

                You requested a password reset for your UtiliTrack account.

                Click the link below to reset your password (valid for 30 minutes):
                %s

                If you did not request this, please ignore this email.

                — UtiliTrack Security Team
                """.formatted(name, resetLink));

            mailSender.send(message);
            log.info("Password reset email sent successfully to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send reset email to {}: {}", toEmail, e.getMessage());
            // Intentionally swallowed to avoid leaking info to client
        }
    }
}