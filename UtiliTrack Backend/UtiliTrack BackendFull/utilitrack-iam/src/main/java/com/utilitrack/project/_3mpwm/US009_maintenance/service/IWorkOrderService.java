package com.utilitrack.project._3mpwm.US009_maintenance.service;

import com.utilitrack.project._3mpwm.US009_maintenance.dto.WorkOrderDTO;
import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IWorkOrderService {

    /**
     * Create a new work order
     * @param dto Work order details
     * @param plannerId Planner creating the work order
     * @return Created work order DTO
     */
    WorkOrderDTO createWorkOrder(WorkOrderDTO dto, String plannerId);

    /**
     * Update an existing work order
     * @param id Work order ID
     * @param dto Updated work order details
     * @param updatedBy User updating the work order
     * @return Updated work order DTO
     */
    WorkOrderDTO updateWorkOrder(Long id, WorkOrderDTO dto, String updatedBy);

    /**
     * Get work order by ID
     * @param id Work order ID
     * @return Work order DTO
     */
    Optional<WorkOrderDTO> getWorkOrderById(Long id);

    /**
     * Get work order by work order number
     * @param workOrderNumber Work order number
     * @return Work order DTO
     */
    Optional<WorkOrderDTO> getWorkOrderByNumber(String workOrderNumber);

    /**
     * Get all work orders for an asset
     * @param assetId Asset ID
     * @return List of work order DTOs
     */
    List<WorkOrderDTO> getWorkOrdersByAssetId(Long assetId);

    /**
     * Get work orders for an asset with pagination
     * @param assetId Asset ID
     * @param pageable Pagination info
     * @return Page of work order DTOs
     */

    Page<WorkOrderDTO> getWorkOrdersByAssetId(Long assetId, Pageable pageable);

    /**
     * Get work orders by status
     * @param status Work order status
     * @return List of work order DTOs
     */
    List<WorkOrderDTO> getWorkOrdersByStatus(WorkOrder.WorkOrderStatus status);

    /**
     * Get work orders by status with pagination
     * @param status Work order status
     * @param pageable Pagination info
     * @return Page of work order DTOs
     */
    Page<WorkOrderDTO> getWorkOrdersByStatus(WorkOrder.WorkOrderStatus status, Pageable pageable);

    /**
     * Get work orders assigned to a planner
     * @param plannerId Planner ID
     * @param pageable Pagination info
     * @return Page of work order DTOs
     */
    Page<WorkOrderDTO> getWorkOrdersByPlanner(String plannerId, Pageable pageable);

    /**
     * Get work orders for planner with specific status
     * @param plannerId Planner ID
     * @param status Work order status
     * @param pageable Pagination info
     * @return Page of work order DTOs
     */
    Page<WorkOrderDTO> getWorkOrdersByPlannerAndStatus(String plannerId, WorkOrder.WorkOrderStatus status, Pageable pageable);

    /**
     * Get work orders scheduled in date range
     * @param startDate Start date/time
     * @param endDate End date/time
     * @return List of work order DTOs
     */
    List<WorkOrderDTO> getScheduledWorkOrdersInRange(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get work orders by priority
     * @param priority Priority level
     * @return List of work order DTOs
     */
    List<WorkOrderDTO> getWorkOrdersByPriority(WorkOrder.Priority priority);

    /**
     * Get work orders by maintenance profile
     * @param profileId Maintenance profile ID
     * @return List of work order DTOs
     */
    List<WorkOrderDTO> getWorkOrdersByMaintenanceProfile(Long profileId);

    /**
     * Get overdue work orders
     * @return List of overdue work order DTOs
     */
    List<WorkOrderDTO> getOverdueWorkOrders();

    /**
     * Assign crew to work order
     * @param id Work order ID
     * @param crewMembers List of crew member IDs
     * @return Updated work order DTO
     */
    WorkOrderDTO assignCrew(Long id, List<String> crewMembers);

    /**
     * Update work order status
     * @param id Work order ID
     * @param newStatus New status
     * @return Updated work order DTO
     */
    WorkOrderDTO updateStatus(Long id, WorkOrder.WorkOrderStatus newStatus);

    /**
     * Start work order execution
     * @param id Work order ID
     * @return Updated work order DTO
     */
    WorkOrderDTO startWorkOrder(Long id);

    /**
     * Complete work order
     * @param id Work order ID
     * @param completionNotes Completion notes
     * @param actualCost Actual cost incurred
     * @return Updated work order DTO
     */
    WorkOrderDTO completeWorkOrder(Long id, String completionNotes, Double actualCost);

    /**
     * Cancel work order
     * @param id Work order ID
     * @param cancellationReason Reason for cancellation
     * @return Updated work order DTO
     */
    WorkOrderDTO cancelWorkOrder(Long id, String cancellationReason);

    /**
     * Delete/Archive a work order
     * @param id Work order ID
     */
    void deleteWorkOrder(Long id);

    /**
     * Validate work order configuration
     * @param dto Work order to validate
     * @return Validation result
     */
    WorkOrderValidationResult validateWorkOrder(WorkOrderDTO dto);

    /**
     * Generate work order number
     * @return Generated work order number
     */
    String generateWorkOrderNumber();

    /**
     * Get work orders created by user
     * @param createdBy User ID
     * @param pageable Pagination info
     * @return Page of work order DTOs
     */
    Page<WorkOrderDTO> getWorkOrdersByCreatedBy(String createdBy, Pageable pageable);
    List<WorkOrderDTO> getAllWorkOrders();

}
