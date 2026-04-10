package com.utilitrack.project.US003_password_reset.service;
import com.utilitrack.project.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.repository.UserRepository;
import com.utilitrack.project._1iam.US001_user_role_management.service.AuditService;
import com.utilitrack.project._1iam.US003_password_reset.dto.ResetPasswordRequest;
import com.utilitrack.project.entity.PasswordResetToken;
import com.utilitrack.project._1iam.US003_password_reset.repository.PasswordResetTokenRepository;
import com.utilitrack.project._1iam.US003_password_reset.service.EmailService;
import com.utilitrack.project._1iam.US003_password_reset.service.PasswordResetService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** TEAM-47: Password reset unit tests */
@ExtendWith(MockitoExtension.class)
class US003PasswordResetServiceTest {
    @Mock UserRepository userRepository;
    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock
    EmailService emailService;
    @Mock AuditService auditService;
    @InjectMocks
    PasswordResetService service;

    private User user;
    private PasswordResetToken validToken;

    @BeforeEach void setUp() {
        user = User.builder().id(1L).name("Alice").email("alice@x.com")
                .password("$2a$hashed").forcePasswordChange(false).build();
        validToken = PasswordResetToken.builder()
                .id(1L).user(user).token("valid-uuid-token")
                .expiresAt(LocalDateTime.now().plusMinutes(30)).used(false).build();
    }

    @Test @DisplayName("TEAM-47: Reset succeeds with valid token")
    void resetPassword_validToken_success() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("valid-uuid-token");
        req.setNewPassword("NewPass@1");
        when(tokenRepository.findByToken("valid-uuid-token")).thenReturn(Optional.of(validToken));
        when(passwordEncoder.encode("NewPass@1")).thenReturn("$2a$newHash");
        service.resetPassword(req);
        verify(userRepository).save(user);
        assertThat(validToken.isUsed()).isTrue();
        assertThat(user.getPassword()).isEqualTo("$2a$newHash");
        assertThat(user.isForcePasswordChange()).isFalse();
    }

    @Test @DisplayName("TEAM-47: Reset fails with expired token")
    void resetPassword_expiredToken_throws() {
        validToken.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("valid-uuid-token"); req.setNewPassword("NewPass@1");
        when(tokenRepository.findByToken("valid-uuid-token")).thenReturn(Optional.of(validToken));
        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");
    }

    @Test @DisplayName("TEAM-47: Reset fails with already-used token")
    void resetPassword_usedToken_throws() {
        validToken.setUsed(true);
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("valid-uuid-token"); req.setNewPassword("NewPass@1");
        when(tokenRepository.findByToken("valid-uuid-token")).thenReturn(Optional.of(validToken));
        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("used");
    }

    @Test @DisplayName("TEAM-47: Reset fails with invalid token")
    void resetPassword_invalidToken_throws() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("bad-token"); req.setNewPassword("NewPass@1");
        when(tokenRepository.findByToken("bad-token")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid");
    }
}
