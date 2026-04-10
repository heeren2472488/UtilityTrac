package com.utilitrack.project._3mpwm.US009_maintenance.repository;

import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    /* =====================================================
       Core US009 queries
       ===================================================== */

    Optional<WorkOrder> findByWorkOrderNumber(String workOrderNumber);

    List<WorkOrder> findByAssetIdOrderByCreatedAtDesc(Long assetId);

    Page<WorkOrder> findByAssetIdOrderByCreatedAtDesc(Long assetId, Pageable pageable);

    List<WorkOrder> findByStatusOrderByScheduledStartDateAsc(
            WorkOrder.WorkOrderStatus status);

    Page<WorkOrder> findByStatusOrderByScheduledStartDateAsc(
            WorkOrder.WorkOrderStatus status, Pageable pageable);

    Page<WorkOrder> findByPlannerIdOrderByCreatedAtDesc(
            String plannerId, Pageable pageable);

    List<WorkOrder> findByPriorityOrderByScheduledStartDateAsc(
            WorkOrder.Priority priority);

    List<WorkOrder> findByMaintenanceProfileIdOrderByCreatedAtDesc(
            Long maintenanceProfileId);

    Page<WorkOrder> findByPlannerIdAndStatusOrderByScheduledStartDateAsc(
            String plannerId,
            WorkOrder.WorkOrderStatus status,
            Pageable pageable);

    List<WorkOrder> findByMaintenanceProfileId(Long maintenanceProfileId);


    List<WorkOrder> findByWorkTypeAndStatusOrderByScheduledStartDateAsc(
            WorkOrder.WorkType workType,
            WorkOrder.WorkOrderStatus status);

    long countByStatus(WorkOrder.WorkOrderStatus status);

    long countByAssetIdAndStatus(Long assetId, WorkOrder.WorkOrderStatus status);

    Page<WorkOrder> findByCreatedByOrderByCreatedAtDesc(
            String createdBy, Pageable pageable);

    /* =====================================================
       US009 Scheduling / Overdue
       ===================================================== */

    @Query("""
           SELECT wo
           FROM WorkOrder wo
           WHERE wo.scheduledStartDate >= :startDate
             AND wo.scheduledStartDate <= :endDate
             AND wo.status IN ('SCHEDULED', 'ASSIGNED', 'IN_PROGRESS')
           ORDER BY wo.scheduledStartDate ASC
           """)
    List<WorkOrder> findScheduledWorkOrdersInDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("""
           SELECT wo
           FROM WorkOrder wo
           WHERE wo.scheduledEndDate < :currentDateTime
             AND wo.status IN ('SCHEDULED', 'ASSIGNED', 'IN_PROGRESS')
           ORDER BY wo.scheduledStartDate ASC
           """)
    List<WorkOrder> findOverdueWorkOrders(
            @Param("currentDateTime") LocalDateTime currentDateTime);

    /* =====================================================
       ✅ US012 Planning features (MERGED HERE)
       ===================================================== */

    /**
     * Calendar plan load (US012)
     */
    @Query("""
           SELECT wo
           FROM WorkOrder wo
           WHERE wo.scheduledStartDate >= :startDate
             AND wo.scheduledEndDate <= :endDate
           ORDER BY wo.scheduledStartDate ASC
           """)
    List<WorkOrder> findCalendarPlanLoad(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Plan load heatmap summary (US012)
     */
    @Query("""
           SELECT wo.status, COUNT(wo)
           FROM WorkOrder wo
           GROUP BY wo.status
           """)
    List<Object[]> countWorkOrdersGroupedByStatus();
}