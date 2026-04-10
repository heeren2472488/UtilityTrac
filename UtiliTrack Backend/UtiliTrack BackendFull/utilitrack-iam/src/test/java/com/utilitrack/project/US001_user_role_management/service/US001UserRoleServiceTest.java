package com.utilitrack.project.US001_user_role_management.service;

import com.utilitrack.project.common.ConflictException;
import com.utilitrack.project.entity.Role;
import com.utilitrack.project.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.dto.*;
import com.utilitrack.project._1iam.US001_user_role_management.repository.RoleRepository;
import com.utilitrack.project._1iam.US001_user_role_management.repository.UserRepository;
import com.utilitrack.project._1iam.US001_user_role_management.service.AuditService;
import com.utilitrack.project._1iam.US001_user_role_management.service.RoleService;
import com.utilitrack.project._1iam.US001_user_role_management.service.UserService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * US001 - Unit Tests (TEAM-49 to TEAM-52)
 * Tests: role creation, duplicate detection, user creation, role assignment
 */
@ExtendWith(MockitoExtension.class)
class US001UserRoleServiceTest {

    @Mock
    RoleRepository roleRepository;
    @Mock
    UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock
    AuditService auditService;
    @InjectMocks
    RoleService roleService;
    @InjectMocks
    UserService userService;

    private Role adminRole;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        adminRole = Role.builder().id(1L).name("ADMIN").createdAt(LocalDateTime.now()).build();
        sampleUser = User.builder().id(1L).name("John").email("john@test.com")
                .password("$2a$hashed").forcePasswordChange(true)
                .roles(new HashSet<>()).createdAt(LocalDateTime.now()).build();
    }

    // ── ROLE TESTS ─────────────────────────────────────────────────────────

    @Test @DisplayName("US001-TEAM-51: Create role successfully")
    void createRole_success() {
        CreateRoleRequest req = new CreateRoleRequest();
        req.setName("TECHNICIAN"); req.setDescription("Field tech");

        when(roleRepository.existsByName("TECHNICIAN")).thenReturn(false);
        when(roleRepository.save(any())).thenReturn(
                Role.builder().id(2L).name("TECHNICIAN").createdAt(LocalDateTime.now()).build());

        RoleResponse result = roleService.createRole(req, 1L, "admin@test.com");

        assertThat(result.getName()).isEqualTo("TECHNICIAN");
        verify(auditService).log(eq(1L), eq("admin@test.com"), eq("CREATE_ROLE"), anyString(), any());
    }

    @Test @DisplayName("US001-TEAM-51: Duplicate role name → 409 ConflictException")
    void createRole_duplicate_throws409() {
        CreateRoleRequest req = new CreateRoleRequest();
        req.setName("ADMIN");
        when(roleRepository.existsByName("ADMIN")).thenReturn(true);

        assertThatThrownBy(() -> roleService.createRole(req, 1L, "admin@test.com"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ADMIN");
        verify(roleRepository, never()).save(any());
    }

    // ── USER TESTS ─────────────────────────────────────────────────────────

    @Test @DisplayName("US001-TEAM-52: Create user with BCrypt hash and forcePasswordChange=true")
    void createUser_success_hashedPasswordAndForceChange() {
        CreateUserRequest req = new CreateUserRequest();
        req.setName("Jane"); req.setEmail("jane@test.com"); req.setTemporaryPassword("Temp@123");

        when(userRepository.existsByEmail("jane@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Temp@123")).thenReturn("$2a$hashed");
        when(userRepository.save(any())).thenReturn(sampleUser);

        UserResponse result = userService.createUser(req, 1L, "admin@test.com");

        assertThat(result).isNotNull();
        verify(passwordEncoder).encode("Temp@123");
        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertThat(cap.getValue().isForcePasswordChange()).isTrue();
        assertThat(cap.getValue().getPassword()).isEqualTo("$2a$hashed");
    }

    @Test @DisplayName("US001-TEAM-52: Duplicate email → 409 ConflictException")
    void createUser_duplicateEmail_throws409() {
        CreateUserRequest req = new CreateUserRequest();
        req.setName("Jane"); req.setEmail("jane@test.com"); req.setTemporaryPassword("Temp@123");
        when(userRepository.existsByEmail("jane@test.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(req, 1L, "admin@test.com"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("jane@test.com");
        verify(userRepository, never()).save(any());
    }

    @Test @DisplayName("US001-TEAM-52: Assign roles — no duplicates (Set semantics)")
    void assignRoles_noDuplicates() {
        sampleUser.getRoles().add(adminRole);
        AssignRolesRequest req = new AssignRolesRequest();
        req.setRoleNames(Set.of("ADMIN"));

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(roleRepository.findByNameIn(Set.of("ADMIN"))).thenReturn(Set.of(adminRole));
        when(userRepository.save(any())).thenReturn(sampleUser);

        UserResponse result = userService.assignRoles(1L, req, 1L, "admin@test.com");

        assertThat(result.getRoles()).hasSize(1); // still only 1, no duplicate
    }
}
