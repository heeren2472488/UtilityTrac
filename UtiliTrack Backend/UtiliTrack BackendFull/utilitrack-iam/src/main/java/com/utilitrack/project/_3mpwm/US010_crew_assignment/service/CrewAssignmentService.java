package com.utilitrack.project._3mpwm.US010_crew_assignment.service;

import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import com.utilitrack.project._3mpwm.US009_maintenance.repository.WorkOrderRepository;
import com.utilitrack.project.entity.Crew;
import com.utilitrack.project._3mpwm.US010_crew_assignment.repository.CrewRepository;
import com.utilitrack.project.common.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CrewAssignmentService {

    private final WorkOrderRepository workOrderRepository;
    private final CrewRepository crewRepository;
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

        return crewRepository.save(crew);
    }


    // ✅ Get all crews
    public List<Crew> getAllCrews(boolean availableOnly) {
        return availableOnly
                ? crewRepository.findByStatus(Crew.CrewStatus.AVAILABLE)
                : crewRepository.findAll();
    }
    @Transactional
    public void deleteCrew(Long crewId) {

        Crew crew = crewRepository.findById(crewId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Crew not found with ID: " + crewId));

        // ✅ Optional safety check (recommended)
        if (crew.getStatus() == Crew.CrewStatus.ON_DUTY) {
            throw new IllegalStateException(
                    "Cannot delete crew that is currently assigned.");
        }

        crewRepository.delete(crew);
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
        workOrder.setStatus(WorkOrder.WorkOrderStatus.ASSIGNED);

        crew.setStatus(Crew.CrewStatus.ON_DUTY);
        crewRepository.save(crew);

        WorkOrder saved = workOrderRepository.save(workOrder);
        notificationService.notifyCrew(crew, saved);

        return saved;
    }

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
        workOrder.setStatus(WorkOrder.WorkOrderStatus.SCHEDULED);

        return workOrderRepository.save(workOrder);
    }
}