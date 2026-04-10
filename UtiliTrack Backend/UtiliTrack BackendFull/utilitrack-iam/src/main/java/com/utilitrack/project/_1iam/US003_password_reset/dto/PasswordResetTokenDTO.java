package com.utilitrack.project._1iam.US003_password_reset.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetTokenDTO {

    private Long id;
    private Long userId;
    private String token;
    private LocalDateTime expiresAt;
    private boolean used;
}