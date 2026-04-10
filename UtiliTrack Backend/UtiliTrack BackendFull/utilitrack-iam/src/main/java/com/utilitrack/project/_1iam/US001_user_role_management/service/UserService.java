package com.utilitrack.project._1iam.US001_user_role_management.service;

import com.utilitrack.project._1iam.US001_user_role_management.dto.AssignRolesRequest;
import com.utilitrack.project._1iam.US001_user_role_management.dto.CreateUserRequest;
import com.utilitrack.project._1iam.US001_user_role_management.dto.UserResponse;

import com.utilitrack.project._1iam.US001_user_role_management.entity.Role;
import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.repository.RoleRepository;
import com.utilitrack.project._1iam.US001_user_role_management.repository.UserRepository;
import com.utilitrack.project.common.*;
import com.utilitrack.project.config.SecurityConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    // SPRING SECURITY
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
    @Transactional
    public void increaseLoginAttempts(User user) {
        int attempts = user.getLoginAttempts() + 1;
        user.setLoginAttempts(attempts);

        if (attempts >= SecurityConstants.MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now()
                    .plusMinutes(SecurityConstants.LOCK_TIME_MINUTES));
        }

        userRepository.save(user);
    }

    @Transactional
    public void resetLoginAttempts(User user) {
        user.setLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
    }

    // CREATE USER
    @Transactional
    public UserResponse createUser(CreateUserRequest req, Long actorId, String actorEmail) {

        if (userRepository.existsByEmail(req.getEmail()))
            throw new ConflictException("Email already registered: " + req.getEmail());

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getTemporaryPassword()))
                .forcePasswordChange(true)
                .enabled(true)
                .build();

        if (req.getRoleNames() != null && !req.getRoleNames().isEmpty())
            user.setRoles(resolveRoles(req.getRoleNames()));

        return toResponse(userRepository.save(user));
    }

    // UPDATE USER
    @Transactional
    public UserResponse updateUser(Long id, CreateUserRequest req, Long actorId, String actorEmail) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        user.setName(req.getName());
        user.setEmail(req.getEmail());

        if (req.getTemporaryPassword() != null && !req.getTemporaryPassword().isBlank())
            user.setPassword(passwordEncoder.encode(req.getTemporaryPassword()));

        return toResponse(userRepository.save(user));
    }

    // DELETE USER
    @Transactional
    public void deleteUser(Long id, Long actorId, String actorEmail) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        userRepository.delete(user);
    }

    // ASSIGN ROLES
    @Transactional
    public UserResponse assignRoles(Long id, AssignRolesRequest req, Long actorId, String actorEmail) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        user.getRoles().addAll(resolveRoles(req.getRoleNames()));

        return toResponse(userRepository.save(user));
    }

    // REMOVE ROLES
    @Transactional
    public UserResponse removeRoles(Long id, AssignRolesRequest req, Long actorId, String actorEmail) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        Set<String> normalized = req.getRoleNames().stream()
                .map(s -> s.toUpperCase().replace(" ", "_"))
                .collect(Collectors.toSet());

        user.getRoles().removeIf(r -> normalized.contains(r.getName()));

        return toResponse(userRepository.save(user));
    }


    // LIST USERS
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> listUsers(String search, Pageable pageable) {

        Page<User> page = (search != null && !search.isBlank())
                ? userRepository.search(search, pageable)
                : userRepository.findAll(pageable);

        return PagedResponse.from(page, this::toResponse);
    }

    // ROLE NORMALIZATION FIX
    private Set<Role> resolveRoles(Set<String> names) {

        Map<String, String> uiToDbMap = Map.of(
                "OPERATION PLANNER", "OPERATIONS PLANNER",
                "FIELD TECHNICIAN", "FIELD TECHNICIAN",
                "CONTROL ROOM OPERATOR", "CONTOR ROOM OPERATOR",
                "BILLING AND CUSTOMER OPS", "BILLING CUSTOMERS OPS",
                "REGULATORY ANALYST", "REGULATORY ANALYST",
                "UTILITY ADMIN", "UTILITY ADMIN",
                "TECHNICIAN", "TECHNICIAN"
        );

        Set<String> normalized = names.stream()
                .map(s -> uiToDbMap.getOrDefault(s.toUpperCase(), s.toUpperCase()))
                .collect(Collectors.toSet());

        Set<Role> found = roleRepository.findByNameIn(normalized);

        Set<String> missing = normalized.stream()
                .filter(n -> found.stream().noneMatch(r -> r.getName().equals(n)))
                .collect(Collectors.toSet());

        if (!missing.isEmpty())
            throw new ResourceNotFoundException("Roles not found: " + missing);

        return found;
    }

    // RESPONSE
    public UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .roles(u.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .enabled(u.isEnabled())
                .forcePasswordChange(u.isForcePasswordChange())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
