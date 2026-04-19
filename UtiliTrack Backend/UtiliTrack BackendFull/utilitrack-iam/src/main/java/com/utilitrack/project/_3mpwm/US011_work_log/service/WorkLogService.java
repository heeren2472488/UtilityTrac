package com.utilitrack.project._3mpwm.US011_work_log.service;

import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import com.utilitrack.project._3mpwm.US009_maintenance.repository.WorkOrderRepository;
import com.utilitrack.project._3mpwm.US011_work_log.dto.WorkLogRequestDTO;
import com.utilitrack.project._3mpwm.US011_work_log.dto.WorkLogResponseDTO;
import com.utilitrack.project._3mpwm.US011_work_log.repository.WorkLogRepository;
import com.utilitrack.project.common.ResourceNotFoundException;
import com.utilitrack.project.entity.WorkLog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkLogService {

    private final WorkLogRepository workLogRepository;
    private final WorkOrderRepository workOrderRepository;

    /* ===============================
       CREATE WORK LOG
       =============================== */
    @Transactional
    public WorkLogResponseDTO logWork(Long workOrderId, WorkLogRequestDTO request) {

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("WorkOrder not found with ID: " + workOrderId));

        WorkLog log = new WorkLog();
        log.setWorkOrder(workOrder);
        log.setTechnicianId(request.getTechnicianId());
        log.setCompletionStatus(
                WorkLog.CompletionStatus.valueOf(request.getCompletionStatus()));
        log.setHoursWorked(request.getHoursWorked());
        log.setNotes(request.getNotes());
        log.setPartsUsedJson(request.getPartsUsedJson());
        log.setLoggedDate(
                request.getLoggedDate() != null ? request.getLoggedDate() : LocalDate.now()
        );

        WorkLog saved = workLogRepository.save(log);

        if (WorkLog.CompletionStatus.COMPLETED.equals(saved.getCompletionStatus())) {
            workOrder.setStatus(WorkOrder.WorkOrderStatus.COMPLETED);
            workOrderRepository.save(workOrder);
        }

        return toDTO(saved);
    }

    /* ===============================
       READ OPERATIONS
       =============================== */

    @Transactional(readOnly = true)
    public List<WorkLogResponseDTO> getLogsByWorkOrder(Long workOrderId) {
        if (!workOrderRepository.existsById(workOrderId)) {
            throw new ResourceNotFoundException("WorkOrder not found with ID: " + workOrderId);
        }

        return workLogRepository.findByWorkOrder_Id(workOrderId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkLogResponseDTO getLogById(Long workLogId) {
        return workLogRepository.findById(workLogId)
                .map(this::toDTO)
                .orElseThrow(() ->
                        new ResourceNotFoundException("WorkLog not found with ID: " + workLogId));
    }

    @Transactional(readOnly = true)
    public List<WorkLogResponseDTO> getAllWorkLogs() {
        return workLogRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /* ===============================
       UPDATE WORK LOG
       =============================== */

    @Transactional
    public WorkLogResponseDTO updateWorkLog(Long workLogId, WorkLogRequestDTO request) {

        WorkLog existing = workLogRepository.findById(workLogId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("WorkLog not found with ID: " + workLogId));

        existing.setNotes(request.getNotes());
        existing.setHoursWorked(request.getHoursWorked());
        existing.setPartsUsedJson(request.getPartsUsedJson());
        existing.setCompletionStatus(
                WorkLog.CompletionStatus.valueOf(request.getCompletionStatus()));
        existing.setTechnicianId(request.getTechnicianId());

        if (WorkLog.CompletionStatus.COMPLETED.equals(existing.getCompletionStatus())) {
            WorkOrder workOrder = existing.getWorkOrder();
            workOrder.setStatus(WorkOrder.WorkOrderStatus.COMPLETED);
            workOrderRepository.save(workOrder);
        }

        return toDTO(workLogRepository.save(existing));
    }

    /* ===============================
       MAPPER
       =============================== */

    private WorkLogResponseDTO toDTO(WorkLog log) {
        WorkLogResponseDTO dto = new WorkLogResponseDTO();
        dto.setId(log.getId());
        dto.setWorkOrderId(log.getWorkOrder().getId());
        dto.setTechnicianId(log.getTechnicianId());
        dto.setCompletionStatus(log.getCompletionStatus().name());
        dto.setHoursWorked(log.getHoursWorked());
        dto.setLoggedDate(log.getLoggedDate());
        dto.setNotes(log.getNotes());
        dto.setPartsUsedJson(log.getPartsUsedJson());
        return dto;
    }
}