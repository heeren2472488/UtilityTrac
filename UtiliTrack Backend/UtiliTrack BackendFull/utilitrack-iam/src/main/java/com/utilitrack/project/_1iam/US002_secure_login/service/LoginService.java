package com.utilitrack.project._1iam.US002_secure_login.service;

import com.utilitrack.project._1iam.US001_user_role_management.entity.Role;
import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.repository.UserRepository;
import com.utilitrack.project._1iam.US001_user_role_management.service.AuditService;
import com.utilitrack.project._1iam.US002_secure_login.dto.LoginRequest;
import com.utilitrack.project._1iam.US002_secure_login.dto.LoginResponse;
import com.utilitrack.project.config.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * US002: Secure login with BCrypt + JWT
 * Features:
 * - Failed login tracking
 * - Account lock after N attempts
 * - Reset attempts on success
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    @Value("${app.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.login.lockout-minutes:15}")
    private int lockoutMinutes;

    @Transactional
    public LoginResponse login(LoginRequest req) {

        // ✅ Find user (do NOT leak whether email exists)
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() ->
                        new UsernameNotFoundException("Invalid email or password"));

        // ✅ Check if account is currently locked
        if (user.getLockedUntil() != null &&
                LocalDateTime.now().isBefore(user.getLockedUntil())) {

            long minutesLeft =
                    Duration.between(LocalDateTime.now(), user.getLockedUntil())
                            .toMinutes() + 1;

            log.warn("Locked account login attempt: {} ({}m remaining)", 
                    user.getEmail(), minutesLeft);

            throw new LockedException(
                    "Account locked. Try again in " + minutesLeft + " minute(s).");
        }

        // ✅ Also check if loginAttempts exceed max (extra safety)
        if (user.getLoginAttempts() >= maxAttempts) {
            log.warn("Account exceeded max attempts: {} ({})", 
                    user.getEmail(), user.getLoginAttempts());
            
            user.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
            userRepository.save(user);
            
            throw new LockedException(
                    "Account locked due to too many failed attempts. Try again in " 
                    + lockoutMinutes + " minute(s).");
        }

        // ✅ Validate password
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            handleFailedAttempt(user);

            int remaining = maxAttempts - user.getLoginAttempts();
            String msg = remaining <= 0
                    ? "Account locked for " + lockoutMinutes +
                    " minutes after too many failed attempts."
                    : "Invalid password. " +
                    remaining + " attempt(s) remaining.";

            throw new BadCredentialsException(msg);
        }

        // ✅ Successful login → reset counters
        user.setLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        List<String> roleNames = user.getRoles()
                .stream()
                .map(Role::getName)
                .toList();

        String token = jwtUtil.generateToken(user.getEmail(), roleNames);

        auditService.log(
                user.getId(),
                user.getEmail(),
                "LOGIN",
                "User#" + user.getEmail()
        );

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .roles(
                        user.getRoles()
                                .stream()
                                .map(Role::getName)
                                .collect(Collectors.toSet())
                )
                .forcePasswordChange(user.isForcePasswordChange())
                .build();
    }

    /**
     * Increments failed login attempts and locks account if threshold reached.
     */
    private void handleFailedAttempt(User user) {

        int attempts = user.getLoginAttempts() + 1;
        user.setLoginAttempts(attempts);

        if (attempts >= maxAttempts) {
            user.setLockedUntil(
                    LocalDateTime.now().plusMinutes(lockoutMinutes)
            );

            log.warn(
                    "🔒 Account locked: {} after {} failed attempts",
                    user.getEmail(),
                    attempts
            );

            auditService.log(
                    null,
                    user.getEmail(),
                    "ACCOUNT_LOCKED",
                    "User#" + user.getEmail(),
                    "{\"attempts\":" + attempts + "}"
            );
        }

        userRepository.save(user);
    }
}
