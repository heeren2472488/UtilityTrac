package com.utilitrack.project._3mpwm.US009_maintenance.service.impl;

import com.utilitrack.project._3mpwm.US009_maintenance.dto.WorkOrderDTO;
import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import com.utilitrack.project._3mpwm.US009_maintenance.repository.WorkOrderRepository;
import com.utilitrack.project._3mpwm.US009_maintenance.service.IWorkOrderService;
import com.utilitrack.project._3mpwm.US009_maintenance.service.WorkOrderValidationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class WorkOrderServiceImpl implements IWorkOrderService {

    private final WorkOrderRepository workOrderRepository;

    @Override
    @Transactional
    public WorkOrderDTO createWorkOrder(WorkOrderDTO dto, String plannerId) {
        log.info("Creating work order for asset ID: {}, profile ID: {} by planner: {}", 
            dto.getAssetId(), dto.getMaintenanceProfileId(), plannerId);

        // Validate work order
        WorkOrderValidationResult validation = validateWorkOrder(dto);
        if (!validation.isValid()) {
            log.error("Work order validation failed: {}", validation.getErrors());
            throw new IllegalArgumentException("Work order validation failed: " + validation.getErrors());
        }

        String workOrderNumber = generateWorkOrderNumber();

        WorkOrder workOrder = WorkOrder.builder()
            .workOrderNumber(workOrderNumber)
            .assetId(dto.getAssetId())
            .maintenanceProfileId(dto.getMaintenanceProfileId())
            .title(dto.getTitle())
            .description(dto.getDescription())
            .workType(dto.getWorkType())
            .status(WorkOrder.WorkOrderStatus.CREATED)
            .priority(dto.getPriority())
            .plannerId(plannerId)
            .crewCount(dto.getCrewCount())
            .scheduledStartDate(dto.getScheduledStartDate())
            .scheduledEndDate(dto.getScheduledEndDate())
            .estimatedDurationHours(dto.getEstimatedDurationHours())
            .estimatedCost(dto.getEstimatedCost())
            .partsList(dto.getPartsList())
            .requiredSkills(dto.getRequiredSkills())
            .notes(dto.getNotes())
            .createdBy(plannerId)
            .build();

        WorkOrder saved = workOrderRepository.save(workOrder);
        log.info("Work order created successfully with ID: {}, WO Number: {}", saved.getId(), saved.getWorkOrderNumber());

        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public WorkOrderDTO updateWorkOrder(Long id, WorkOrderDTO dto, String updatedBy) {
        log.info("Updating work order ID: {} by user: {}", id, updatedBy);

        WorkOrder workOrder = workOrderRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Work order not found with ID: {}", id);
                return new IllegalArgumentException("Work order not found with ID: " + id);
            });

        // Validate work order
        WorkOrderValidationResult validation = validateWorkOrder(dto);
        if (!validation.isValid()) {
            log.error("Work order validation failed: {}", validation.getErrors());
            throw new IllegalArgumentException("Work order validation failed: " + validation.getErrors());
        }

        workOrder.setTitle(dto.getTitle());
        workOrder.setDescription(dto.getDescription());
        workOrder.setWorkType(dto.getWorkType());
        workOrder.setPriority(dto.getPriority());
        workOrder.setScheduledStartDate(dto.getScheduledStartDate());
        workOrder.setScheduledEndDate(dto.getScheduledEndDate());
        workOrder.setEstimatedDurationHours(dto.getEstimatedDurationHours());
        workOrder.setEstimatedCost(dto.getEstimatedCost());
        workOrder.setPartsList(dto.getPartsList());
        workOrder.setRequiredSkills(dto.getRequiredSkills());
        workOrder.setNotes(dto.getNotes());
        workOrder.setUpdatedBy(updatedBy);

        WorkOrder updated = workOrderRepository.save(workOrder);
        log.info("Work order updated successfully with ID: {}", updated.getId());

        return convertToDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WorkOrderDTO> getWorkOrderById(Long id) {
        log.debug("Fetching work order ID: {}", id);
        return workOrderRepository.findById(id).map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WorkOrderDTO> getWorkOrderByNumber(String workOrderNumber) {
        log.debug("Fetching work order by number: {}", workOrderNumber);
        return workOrderRepository.findByWorkOrderNumber(workOrderNumber).map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderDTO> getWorkOrdersByAssetId(Long assetId) {
        log.debug("Fetching work orders for asset ID: {}", assetId);
        return workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderDTO> getWorkOrdersByAssetId(Long assetId, Pageable pageable) {
        log.debug("Fetching work orders for asset ID: {} with pagination", assetId);
        return workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId, pageable)
            .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderDTO> getWorkOrdersByStatus(WorkOrder.WorkOrderStatus status) {
        log.debug("Fetching work orders by status: {}", status);
        return workOrderRepository.findByStatusOrderByScheduledStartDateAsc(status)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderDTO> getWorkOrdersByStatus(WorkOrder.WorkOrderStatus status, Pageable pageable) {
        log.debug("Fetching work orders by status: {} with pagination", status);
        return workOrderRepository.findByStatusOrderByScheduledStartDateAsc(status, pageable)
            .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderDTO> getWorkOrdersByPlanner(String plannerId, Pageable pageable) {
        log.debug("Fetching work orders for planner: {}", plannerId);
        return workOrderRepository.findByPlannerIdOrderByCreatedAtDesc(plannerId, pageable)
            .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderDTO> getWorkOrdersByPlannerAndStatus(String plannerId, WorkOrder.WorkOrderStatus status, Pageable pageable) {
        log.debug("Fetching work orders for planner: {} with status: {}", plannerId, status);
        return workOrderRepository.findByPlannerIdAndStatusOrderByScheduledStartDateAsc(plannerId, status, pageable)
            .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderDTO> getScheduledWorkOrdersInRange(LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Fetching scheduled work orders between {} and {}", startDate, endDate);
        return workOrderRepository.findScheduledWorkOrdersInDateRange(startDate, endDate)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderDTO> getWorkOrdersByPriority(WorkOrder.Priority priority) {
        log.debug("Fetching work orders by priority: {}", priority);
        return workOrderRepository.findByPriorityOrderByScheduledStartDateAsc(priority)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderDTO> getAllWorkOrders() {
        log.debug("Fetching all work orders");

        return workOrderRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderDTO> getWorkOrdersByMaintenanceProfile(Long profileId) {
        log.debug("Fetching work orders for maintenance profile ID: {}", profileId);
        return workOrderRepository.findByMaintenanceProfileId(profileId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderDTO> getOverdueWorkOrders() {
        log.debug("Fetching overdue work orders");
        return workOrderRepository.findOverdueWorkOrders(LocalDateTime.now())
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WorkOrderDTO assignCrew(Long id, List<String> crewMembers) {
        log.info("Assigning crew to work order ID: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Work order not found with ID: {}", id);
                return new IllegalArgumentException("Work order not found with ID: " + id);
            });

        String crewString = String.join(", ", crewMembers);
        workOrder.setAssignedCrew(crewString);
        workOrder.setCrewCount(crewMembers.size());
        workOrder.setStatus(WorkOrder.WorkOrderStatus.ASSIGNED);

        WorkOrder updated = workOrderRepository.save(workOrder);
        log.info("Crew assigned to work order ID: {}, Crew count: {}", id, crewMembers.size());

        return convertToDTO(updated);
    }

    @Override
    @Transactional
    public WorkOrderDTO updateStatus(Long id, WorkOrder.WorkOrderStatus newStatus) {
        log.info("Updating work order ID: {} status to: {}", id, newStatus);

        WorkOrder workOrder = workOrderRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Work order not found with ID: {}", id);
                return new IllegalArgumentException("Work order not found with ID: " + id);
            });

        workOrder.setStatus(newStatus);
        WorkOrder updated = workOrderRepository.save(workOrder);
        log.info("Work order status updated to: {}", newStatus);

        return convertToDTO(updated);
    }

    @Override
    @Transactional
    public WorkOrderDTO startWorkOrder(Long id) {
        log.info("Starting work order ID: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Work order not found with ID: {}", id);
                return new IllegalArgumentException("Work order not found with ID: " + id);
            });

        workOrder.setStatus(WorkOrder.WorkOrderStatus.IN_PROGRESS);
        workOrder.setActualStartDate(LocalDateTime.now());

        WorkOrder updated = workOrderRepository.save(workOrder);
        log.info("Work order started with ID: {}", updated.getId());

        return convertToDTO(updated);
    }

    @Override
    @Transactional
    public WorkOrderDTO completeWorkOrder(Long id, String completionNotes, Double actualCost) {
        log.info("Completing work order ID: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Work order not found with ID: {}", id);
                return new IllegalArgumentException("Work order not found with ID: " + id);
            });

        workOrder.setStatus(WorkOrder.WorkOrderStatus.COMPLETED);
        workOrder.setActualEndDate(LocalDateTime.now());
        workOrder.setCompletionNotes(completionNotes);
        workOrder.setActualCost(actualCost);

        if (workOrder.getActualStartDate() != null) {
            long durationMinutes = java.time.temporal.ChronoUnit.MINUTES.between(
                workOrder.getActualStartDate(), 
                workOrder.getActualEndDate()
            );
            workOrder.setActualDurationHours(durationMinutes / 60.0);
        }

        WorkOrder updated = workOrderRepository.save(workOrder);
        log.info("Work order completed with ID: {}", updated.getId());

        return convertToDTO(updated);
    }

    @Override
    @Transactional
    public WorkOrderDTO cancelWorkOrder(Long id, String cancellationReason) {
        log.info("Cancelling work order ID: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Work order not found with ID: {}", id);
                return new IllegalArgumentException("Work order not found with ID: " + id);
            });

        workOrder.setStatus(WorkOrder.WorkOrderStatus.CANCELLED);
        workOrder.setNotes((workOrder.getNotes() != null ? workOrder.getNotes() + " | " : "") + 
            "CANCELLED: " + cancellationReason);

        WorkOrder updated = workOrderRepository.save(workOrder);
        log.info("Work order cancelled with ID: {}", updated.getId());

        return convertToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteWorkOrder(Long id) {
        log.info("Deleting work order ID: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Work order not found with ID: {}", id);
                return new IllegalArgumentException("Work order not found with ID: " + id);
            });

        workOrderRepository.deleteById(id);
        log.info("Work order deleted with ID: {}", id);
    }

    @Override
    public WorkOrderValidationResult validateWorkOrder(WorkOrderDTO dto) {
        WorkOrderValidationResult result = WorkOrderValidationResult.success();

        if (dto.getAssetId() == null) {
            result.addError("Asset ID is required");
        }

        if (dto.getMaintenanceProfileId() == null) {
            result.addError("Maintenance Profile ID is required");
        }

        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            result.addError("Title is required");
        }

        if (dto.getWorkType() == null) {
            result.addError("Work type is required");
        }

        if (dto.getPriority() == null) {
            result.addError("Priority is required");
        }

        if (dto.getScheduledStartDate() == null) {
            result.addError("Scheduled start date is required");
        }

        if (dto.getScheduledEndDate() == null) {
            result.addError("Scheduled end date is required");
        }

        if (dto.getEstimatedDurationHours() == null || dto.getEstimatedDurationHours() <= 0) {
            result.addError("Estimated duration hours must be greater than 0");
        }

        if (dto.getEstimatedCost() == null || dto.getEstimatedCost() < 0) {
            result.addError("Estimated cost cannot be negative");
        }

        // Check if end date is after start date
        if (dto.getScheduledStartDate() != null && dto.getScheduledEndDate() != null) {
            if (dto.getScheduledEndDate().isBefore(dto.getScheduledStartDate())) {
                result.addError("Scheduled end date must be after start date");
            }
        }

        // Warnings
        if (dto.getPriority() == WorkOrder.Priority.CRITICAL && dto.getScheduledStartDate().isAfter(LocalDateTime.now().plusDays(3))) {
            result.addWarning("Critical priority work order is scheduled more than 3 days in advance");
        }

        return result;
    }

    @Override
    public String generateWorkOrderNumber() {
        // Format: WO-YYYY-XXXXX (e.g., WO-2024-00001)
        long count = workOrderRepository.count();
        return String.format("WO-%d-%05d", LocalDateTime.now().getYear(), count + 1);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderDTO> getWorkOrdersByCreatedBy(String createdBy, Pageable pageable) {
        log.debug("Fetching work orders created by: {}", createdBy);
        return workOrderRepository.findByCreatedByOrderByCreatedAtDesc(createdBy, pageable)
            .map(this::convertToDTO);
    }

    private WorkOrderDTO convertToDTO(WorkOrder workOrder) {
        return WorkOrderDTO.builder()
            .id(workOrder.getId())
            .workOrderNumber(workOrder.getWorkOrderNumber())
            .assetId(workOrder.getAssetId())
            .maintenanceProfileId(workOrder.getMaintenanceProfileId())
            .title(workOrder.getTitle())
            .description(workOrder.getDescription())
            .workType(workOrder.getWorkType())
            .status(workOrder.getStatus())
            .priority(workOrder.getPriority())
            .plannerId(workOrder.getPlannerId())
            .assignedCrew(workOrder.getAssignedCrew())
            .crewCount(workOrder.getCrewCount())
            .scheduledStartDate(workOrder.getScheduledStartDate())
            .scheduledEndDate(workOrder.getScheduledEndDate())
            .estimatedDurationHours(workOrder.getEstimatedDurationHours())
            .actualStartDate(workOrder.getActualStartDate())
            .actualEndDate(workOrder.getActualEndDate())
            .actualDurationHours(workOrder.getActualDurationHours())
            .estimatedCost(workOrder.getEstimatedCost())
            .actualCost(workOrder.getActualCost())
            .partsList(workOrder.getPartsList())
            .requiredSkills(workOrder.getRequiredSkills())
            .notes(workOrder.getNotes())
            .completionNotes(workOrder.getCompletionNotes())
            .createdBy(workOrder.getCreatedBy())
            .createdAt(workOrder.getCreatedAt())
            .updatedBy(workOrder.getUpdatedBy())
            .updatedAt(workOrder.getUpdatedAt())
            .build();
    }
}
