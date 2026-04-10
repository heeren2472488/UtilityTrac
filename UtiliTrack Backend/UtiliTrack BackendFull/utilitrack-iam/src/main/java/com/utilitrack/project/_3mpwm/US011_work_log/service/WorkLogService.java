package com.utilitrack.project._3mpwm.US011_work_log.service;


import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import com.utilitrack.project._3mpwm.US009_maintenance.repository.WorkOrderRepository;
import com.utilitrack.project.entity.WorkLog;
import com.utilitrack.project._3mpwm.US011_work_log.repository.WorkLogRepository;
import com.utilitrack.project.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * US011 - Work Log Service
 *
 * Acceptance Criteria:
 * AC1: Technicians can input work details easily.
 * AC2: The system saves the logged details accurately.
 * AC3: Logged work details are accessible for review.
 */
@Service
@RequiredArgsConstructor
public class WorkLogService {

    private final WorkLogRepository workLogRepository;
    private final WorkOrderRepository workOrderRepository;

    // AC1 + AC2: Log work details for a work order
    @Transactional
    public WorkLog logWork(Long workOrderId, WorkLog workLog) {
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkOrder not found with ID: " + workOrderId));

        // AC1: Accept and bind details
        workLog.setWorkOrder(workOrder);
        if (workLog.getLoggedDate() == null) {
            workLog.setLoggedDate(LocalDate.now());
        }

        // AC2: Save accurately
        WorkLog saved = workLogRepository.save(workLog);

        // If completion status is COMPLETED, update work order status too
        if (WorkLog.CompletionStatus.COMPLETED.equals(workLog.getCompletionStatus())) {
            workOrder.setStatus(WorkOrder.WorkOrderStatus.COMPLETED);
            workOrderRepository.save(workOrder);
        }

        return saved;
    }

    // AC3: Get all logs for a work order (accessible for review)
    public List<WorkLog> getLogsByWorkOrder(Long workOrderId) {
        if (!workOrderRepository.existsById(workOrderId)) {
            throw new ResourceNotFoundException("WorkOrder not found with ID: " + workOrderId);
        }
        return workLogRepository.findByWorkOrder_Id(workOrderId);
    }

    // AC3: Get a specific log by ID
    public WorkLog getLogById(Long workLogId) {
        return workLogRepository.findById(workLogId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkLog not found with ID: " + workLogId));
    }
    // ✅ Get ALL work logs (system-wide)
    public List<WorkLog> getAllWorkLogs() {
        return workLogRepository.findAll();
    }

    // Update a work log
    @Transactional
    public WorkLog updateWorkLog(Long workLogId, WorkLog updatedLog) {
        WorkLog existing = workLogRepository.findById(workLogId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkLog not found with ID: " + workLogId));

        existing.setNotes(updatedLog.getNotes());
        existing.setHoursWorked(updatedLog.getHoursWorked());
        existing.setPartsUsedJson(updatedLog.getPartsUsedJson());
        existing.setCompletionStatus(updatedLog.getCompletionStatus());
        existing.setTechnicianId(updatedLog.getTechnicianId());

        // If marked complete, update the work order
        if (WorkLog.CompletionStatus.COMPLETED.equals(updatedLog.getCompletionStatus())) {
            WorkOrder workOrder = existing.getWorkOrder();
            workOrder.setStatus(WorkOrder.WorkOrderStatus.COMPLETED);
            workOrderRepository.save(workOrder);
        }

        return workLogRepository.save(existing);
    }
}
