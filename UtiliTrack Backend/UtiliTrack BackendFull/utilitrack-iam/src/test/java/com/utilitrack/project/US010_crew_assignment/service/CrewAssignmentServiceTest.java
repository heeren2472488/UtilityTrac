package com.utilitrack.project.US010_crew_assignment.service;

import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.repository.UserRepository;
import com.utilitrack.project._3mpwm.US009_maintenance.repository.WorkOrderRepository;
import com.utilitrack.project._3mpwm.US010_crew_assignment.dto.CrewDetailsResponse;
import com.utilitrack.project._3mpwm.US010_crew_assignment.repository.CrewRepository;
import com.utilitrack.project._3mpwm.US010_crew_assignment.service.CrewAssignmentService;
import com.utilitrack.project._3mpwm.US010_crew_assignment.service.NotificationService;
import com.utilitrack.project.common.ConflictException;
import com.utilitrack.project.common.ResourceNotFoundException;
import com.utilitrack.project.entity.Crew;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CrewAssignmentServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;
    @Mock
    private CrewRepository crewRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CrewAssignmentService crewAssignmentService;

    private Crew crew;
    private User user;

    @BeforeEach
    void setUp() {
        crew = Crew.builder()
                .id(10L)
                .name("North Grid Crew")
                .leaderName("Alex")
                .status(Crew.CrewStatus.AVAILABLE)
                .crewSize(0)
                .members(new HashSet<>())
                .build();

        user = User.builder()
                .id(99L)
                .name("Tech One")
                .email("tech1@utili.test")
                .password("hashed")
                .build();
    }

    @Test
    @DisplayName("Assign member to crew succeeds and returns updated details")
    void assignMemberToCrew_success() {
        when(crewRepository.findByIdWithMembers(10L)).thenReturn(Optional.of(crew));
        when(userRepository.findById(99L)).thenReturn(Optional.of(user));
        when(crewRepository.save(any(Crew.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CrewDetailsResponse response = crewAssignmentService.assignMemberToCrew(10L, 99L);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getMemberCount()).isEqualTo(1);
        assertThat(response.getMembers()).hasSize(1);
        assertThat(response.getMembers().get(0).getId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("Assign member returns 404 when crew does not exist")
    void assignMemberToCrew_crewNotFound() {
        when(crewRepository.findByIdWithMembers(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> crewAssignmentService.assignMemberToCrew(10L, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Crew not found");

        verify(userRepository, never()).findById(any());
    }

    @Test
    @DisplayName("Assign member returns 404 when member does not exist")
    void assignMemberToCrew_memberNotFound() {
        when(crewRepository.findByIdWithMembers(10L)).thenReturn(Optional.of(crew));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> crewAssignmentService.assignMemberToCrew(10L, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Member not found");

        verify(crewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Assign member returns 409 when member already assigned")
    void assignMemberToCrew_duplicateMember() {
        crew.getMembers().add(user);

        when(crewRepository.findByIdWithMembers(10L)).thenReturn(Optional.of(crew));
        when(userRepository.findById(99L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> crewAssignmentService.assignMemberToCrew(10L, 99L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already assigned");

        verify(crewRepository, never()).save(any());
    }
}

