package com.utilitrack.project._1iam.US003_password_reset.repository;

import com.utilitrack.project.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    // ✅ FIXED: correct JPA property path
    void deleteByUser_Id(Long userId);
}