package com.utilitrack.project._3mpwm.US010_crew_assignment.service;

import com.utilitrack.project._1iam.US001_user_role_management.entity.User;
import com.utilitrack.project._1iam.US001_user_role_management.repository.UserRepository;
import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import com.utilitrack.project._3mpwm.US009_maintenance.repository.WorkOrderRepository;
import com.utilitrack.project._3mpwm.US010_crew_assignment.dto.*;
import com.utilitrack.project.entity.Crew;
import com.utilitrack.project._3mpwm.US010_crew_assignment.repository.CrewRepository;
import com.utilitrack.project.common.ConflictException;
import com.utilitrack.project.common.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CrewAssignmentService {

    private final WorkOrderRepository workOrderRepository;
    private final CrewRepository crewRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /* =====================================================
       CREW MANAGEMENT
       ===================================================== */

    // ✅ Create crew (Frontend-aligned)

    public Crew createCrew(Crew crew) {

        // ✅ ADD THIS HERE
        if (crew.getLeaderName() != null && !crew.getLeaderName().isBlank()) {
            crew.setLeaderName(crew.getLeaderName());
        }

        // ✅ Optional defaults (recommended)
        if (crew.getStatus() == null) {
            crew.setStatus(Crew.CrewStatus.AVAILABLE);
        }
        if (crew.getCrewSize() == null) {
            crew.setCrewSize(0);
        }

        return crewRepository.save(crew);
    }


    // ✅ Get all crews
    public List<Crew> getAllCrews(boolean availableOnly) {
        List<Crew> crews = availableOnly
                ? crewRepository.findByStatusWithMembers(Crew.CrewStatus.AVAILABLE)
                : crewRepository.findAllWithMembers();

        crews.forEach(crew -> crew.setCrewSize(crew.getMemberCount()));
        return crews;
    }
    @Transactional
    public Crew updateCrew(Long crewId, CrewUpdateRequest request) {

        Crew crew = crewRepository.findById(crewId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Crew not found with ID: " + crewId));

        crew.setName(request.getName());
        crew.setDescription(request.getDescription());
        crew.setLeaderName(request.getLeaderName());
        crew.setContactInfo(request.getContactInfo());
        crew.setSkillset(request.getSkillset());
        crew.setStatus(request.getStatus());

        return crewRepository.save(crew);
    }
    @Transactional(readOnly = true)
    public CrewListResponse getCrewListSummary(boolean availableOnly) {
        List<CrewListItemResponse> items = getAllCrews(availableOnly).stream()
                .map(this::toCrewListItem)
                .toList();

        int totalMembers = items.stream().mapToInt(CrewListItemResponse::getMemberCount).sum();
        int crewsWithLeader = (int) items.stream().filter(CrewListItemResponse::isLeaderPresent).count();

        return CrewListResponse.builder()
                .totalCrews(items.size())
                .crewsWithLeader(crewsWithLeader)
                .assignedMembers(totalMembers)
                .crews(items)
                .build();
    }
    @Transactional
    public void deleteCrew(Long crewId) {

        Crew crew = crewRepository.findById(crewId)
                .orElseThrow(() -> new ResourceNotFoundException("Crew not found with ID: " + crewId));

        // ✅ Optional safety check (recommended)
        if (crew.getStatus() == Crew.CrewStatus.ON_DUTY) {
            throw new ConflictException("Cannot delete crew that is currently assigned.");
        }

        crewRepository.delete(crew);
    }

    @Transactional
    public CrewDetailsResponse assignMemberToCrew(Long crewId, Long memberId) {
        Crew crew = crewRepository.findByIdWithMembers(crewId)
                .orElseThrow(() -> new ResourceNotFoundException("Crew not found with ID: " + crewId));

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found with ID: " + memberId));

        boolean alreadyAssigned = crew.getMembers().stream()
                .anyMatch(existing -> existing.getId().equals(memberId));
        if (alreadyAssigned) {
            throw new ConflictException("Member is already assigned to this crew.");
        }

        crew.getMembers().add(member);
        crew.setCrewSize(crew.getMembers().size());

        Crew savedCrew = crewRepository.save(crew);
        return toCrewDetails(savedCrew);
    }

    @Transactional(readOnly = true)
    public CrewDetailsResponse getCrewById(Long crewId) {
        Crew crew = crewRepository.findByIdWithMembers(crewId)
                .orElseThrow(() -> new ResourceNotFoundException("Crew not found with ID: " + crewId));

        return toCrewDetails(crew);
    }

    /* =====================================================
       CREW ASSIGNMENT
       ===================================================== */

    @Transactional
    public WorkOrder assignCrewToWorkOrder(Long workOrderId, Long crewId) {

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "WorkOrder not found with ID: " + workOrderId));

        Crew crew = crewRepository.findById(crewId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Crew not found with ID: " + crewId));

        workOrder.setAssignedCrew(crew.getName());
        workOrder.setCrewCount(crew.getMemberCount());
        workOrder.setStatus(WorkOrder.WorkOrderStatus.ASSIGNED);

        crew.setStatus(Crew.CrewStatus.ON_DUTY);
        crewRepository.save(crew);

        WorkOrder saved = workOrderRepository.save(workOrder);
        notificationService.notifyCrew(crew, saved);

        return saved;
    }

    @Transactional(readOnly = true)
    public Crew getAssignedCrew(Long workOrderId) {

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "WorkOrder not found with ID: " + workOrderId));

        if (workOrder.getAssignedCrew() == null) {
            throw new ResourceNotFoundException("No crew assigned.");
        }

        return crewRepository.findByName(workOrder.getAssignedCrew())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Assigned crew not found."));
    }

    @Transactional
    public WorkOrder unassignCrew(Long workOrderId) {

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "WorkOrder not found with ID: " + workOrderId));

        workOrder.setAssignedCrew(null);
        workOrder.setCrewCount(0);
        workOrder.setStatus(WorkOrder.WorkOrderStatus.SCHEDULED);

        return workOrderRepository.save(workOrder);
    }

    private CrewDetailsResponse toCrewDetails(Crew crew) {
        List<CrewMemberResponse> members = crew.getMembers().stream()
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toCrewMember)
                .collect(Collectors.toList());

        return CrewDetailsResponse.builder()
                .id(crew.getId())
                .name(crew.getName())
                .leaderName(crew.getLeaderName())
                .leaderPresent(crew.isLeaderPresent())
                .members(members)
                .memberCount(members.size())
                .build();
    }

    private CrewListItemResponse toCrewListItem(Crew crew) {
        return CrewListItemResponse.builder()
                .id(crew.getId())
                .name(crew.getName())
                .leaderName(crew.getLeaderName())
                .leaderPresent(crew.isLeaderPresent())
                .memberCount(crew.getMemberCount())
                .build();
    }

    private CrewMemberResponse toCrewMember(User user) {
        return CrewMemberResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}

