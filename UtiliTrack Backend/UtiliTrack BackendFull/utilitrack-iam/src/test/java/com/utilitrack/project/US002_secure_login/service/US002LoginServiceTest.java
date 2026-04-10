package com.utilitrack.project.US002_secure_login.service;

import com.utilitrack.project.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.repository.UserRepository;
import com.utilitrack.project._1iam.US001_user_role_management.service.AuditService;
import com.utilitrack.project.config.JwtUtil;
import com.utilitrack.project._1iam.US002_secure_login.dto.LoginRequest;
import com.utilitrack.project._1iam.US002_secure_login.dto.LoginResponse;
import com.utilitrack.project._1iam.US002_secure_login.service.LoginService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * US002 - Unit Tests (TEAM-57)
 * Tests: valid login, invalid password, locked account, password hashing,
 *        JWT generation, attempt tracking, feedback on failures
 */
@ExtendWith(MockitoExtension.class)
class US002LoginServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtUtil jwtUtil;
    @Mock AuditService auditService;
    @InjectMocks
    LoginService loginService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(loginService, "maxAttempts", 5);
        ReflectionTestUtils.setField(loginService, "lockoutMinutes", 15);

        activeUser = User.builder()
                .id(1L).name("John").email("john@test.com")
                .password("$2a$hashed").enabled(true)
                .loginAttempts(0).lockedUntil(null)
                .roles(new HashSet<>()).build();
    }

    @Test @DisplayName("US002-TEAM-57: Valid login returns JWT token")
    void login_success_returnsJwt() {
        LoginRequest req = new LoginRequest();
        req.setEmail("john@test.com"); req.setPassword("correct");

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("correct", "$2a$hashed")).thenReturn(true);
        when(userRepository.save(any())).thenReturn(activeUser);
        when(jwtUtil.generateToken("john@test.com")).thenReturn("jwt.token.here");

        LoginResponse result = loginService.login(req);

        assertThat(result.getToken()).isEqualTo("jwt.token.here");
        assertThat(result.getEmail()).isEqualTo("john@test.com");
        verify(auditService).log(eq(1L), eq("john@test.com"), eq("LOGIN"), anyString());
    }

    @Test @DisplayName("US002-TEAM-57: Invalid password increments attempt counter")
    void login_wrongPassword_incrementsAttempts() {
        LoginRequest req = new LoginRequest();
        req.setEmail("john@test.com"); req.setPassword("wrong");

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrong", "$2a$hashed")).thenReturn(false);
        when(userRepository.save(any())).thenReturn(activeUser);

        assertThatThrownBy(() -> loginService.login(req))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("remaining");

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertThat(cap.getValue().getLoginAttempts()).isEqualTo(1);
    }

    @Test @DisplayName("US002-TEAM-57: Account locks after 5 failed attempts")
    void login_fiveFailures_locksAccount() {
        activeUser.setLoginAttempts(4); // already 4 attempts
        LoginRequest req = new LoginRequest();
        req.setEmail("john@test.com"); req.setPassword("wrong");

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrong", "$2a$hashed")).thenReturn(false);
        when(userRepository.save(any())).thenReturn(activeUser);

        assertThatThrownBy(() -> loginService.login(req))
                .isInstanceOf(BadCredentialsException.class);

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertThat(cap.getValue().getLockedUntil()).isNotNull(); // account locked
        verify(auditService).log(isNull(), eq("john@test.com"), eq("ACCOUNT_LOCKED"), anyString(), any());
    }

    @Test @DisplayName("US002-TEAM-57: Locked account returns LockedException with time remaining")
    void login_lockedAccount_throwsLockedException() {
        activeUser.setLockedUntil(LocalDateTime.now().plusMinutes(10)); // still locked
        LoginRequest req = new LoginRequest();
        req.setEmail("john@test.com"); req.setPassword("any");

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> loginService.login(req))
                .isInstanceOf(LockedException.class)
                .hasMessageContaining("minute");
    }

    @Test @DisplayName("US002-TEAM-57: Login resets attempt counter on success")
    void login_success_resetsAttempts() {
        activeUser.setLoginAttempts(3); // previous failures
        LoginRequest req = new LoginRequest();
        req.setEmail("john@test.com"); req.setPassword("correct");

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("correct", "$2a$hashed")).thenReturn(true);
        when(userRepository.save(any())).thenReturn(activeUser);
        when(jwtUtil.generateToken(any())).thenReturn("token");

        loginService.login(req);

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertThat(cap.getValue().getLoginAttempts()).isEqualTo(0);
        assertThat(cap.getValue().getLockedUntil()).isNull();
    }
}
