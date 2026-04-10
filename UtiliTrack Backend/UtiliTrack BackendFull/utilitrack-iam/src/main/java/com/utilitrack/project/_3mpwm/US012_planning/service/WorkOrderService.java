package com.utilitrack.project._3mpwm.US012_planning.service;

import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import com.utilitrack.project._3mpwm.US009_maintenance.repository.WorkOrderRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WorkOrderService {

    @Autowired
    private WorkOrderRepository workOrderRepository;

    /* ============================================
       Create / Read operations (Planning context)
       ============================================ */

    public WorkOrder createWorkOrder(WorkOrder workOrder) {
        workOrder.setStatus(WorkOrder.WorkOrderStatus.PLANNED);
        return workOrderRepository.save(workOrder);
    }

    public List<WorkOrder> getAllWorkOrders() {
        return workOrderRepository.findAll();
    }

    public WorkOrder getWorkOrderById(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("WorkOrder not found: " + id));
    }

    /* ============================================
       US012 – Calendar plan load
       ============================================ */

    public List<WorkOrder> getCalendarPlanLoad(
            LocalDateTime startDate,
            LocalDateTime endDate) {

        return workOrderRepository.findCalendarPlanLoad(
                startDate, endDate);
    }

    /* ============================================
       US012 – Plan load heatmap summary
       ============================================ */

    public Map<String, Long> getPlanLoadSummary() {

        return workOrderRepository
                .countWorkOrdersGroupedByStatus()
                .stream()
                .collect(Collectors.toMap(
                        row -> row[0].toString(),
                        row -> (Long) row[1]
                ));
    }

    /* ============================================
       Update status
       ============================================ */

    public WorkOrder updateWorkOrderStatus(
            Long id,
            WorkOrder.WorkOrderStatus newStatus) {

        WorkOrder wo = getWorkOrderById(id);
        wo.setStatus(newStatus);

        if (newStatus == WorkOrder.WorkOrderStatus.IN_PROGRESS
                && wo.getActualStartDate() == null) {
            wo.setActualStartDate(LocalDateTime.now());
        }

        if (newStatus == WorkOrder.WorkOrderStatus.COMPLETED
                && wo.getActualEndDate() == null) {
            wo.setActualEndDate(LocalDateTime.now());
        }

        return workOrderRepository.save(wo);
    }

    /* ============================================
       Filter by status (optional)
       ============================================ */

    public List<WorkOrder> getWorkOrdersByStatus(
            WorkOrder.WorkOrderStatus status) {

        return workOrderRepository
                .findByStatusOrderByScheduledStartDateAsc(status);
    }
}