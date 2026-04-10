package com.utilitrack.project._3mpwm.US009_maintenance.controller;

import com.utilitrack.project._3mpwm.US009_maintenance.dto.WorkOrderDTO;
import com.utilitrack.project._3mpwm.US009_maintenance.entity.WorkOrder;
import com.utilitrack.project._3mpwm.US009_maintenance.service.IWorkOrderService;
import com.utilitrack.project._3mpwm.US009_maintenance.service.WorkOrderValidationResult;
import com.utilitrack.project._3mpwm.US012_planning.service.WorkOrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/work-orders")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class WorkOrderController {

    /* ===============================
       Services
       =============================== */

    /** US009 – Maintenance */
    private final IWorkOrderService maintenanceService;

    /** US012 – Planning */
    private final WorkOrderService planningService;

    /* ======================================================
       US009 – Maintenance APIs
       ====================================================== */

    @PostMapping
    @PreAuthorize("hasRole('')")
    public ResponseEntity<WorkOrderDTO> createWorkOrder(
            @Valid @RequestBody WorkOrderDTO dto,
            @RequestHeader(value = "X-User-ID", required = false) String userId) {

        String plannerId = userId != null ? userId : "SYSTEM";
        log.info("Creating work order by {}", plannerId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(maintenanceService.createWorkOrder(dto, plannerId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PLANNER')")
    public ResponseEntity<WorkOrderDTO> updateWorkOrder(
            @PathVariable Long id,
            @Valid @RequestBody WorkOrderDTO dto,
            @RequestHeader(value = "X-User-ID", required = false) String userId) {

        return ResponseEntity.ok(
                maintenanceService.updateWorkOrder(
                        id, dto, userId != null ? userId : "SYSTEM"));
    }
    // ✅ GET ALL WORK ORDERS
    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATIONS PLANNER','TECHNICIAN','OPERATOR')")
    public ResponseEntity<List<WorkOrderDTO>> getAllWorkOrders() {

        return ResponseEntity.ok(
                maintenanceService.getAllWorkOrders()
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLANNER','TECHNICIAN','OPERATOR')")
    public ResponseEntity<WorkOrderDTO> getWorkOrder(@PathVariable Long id) {
        return maintenanceService.getWorkOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PLANNER')")
    public ResponseEntity<Void> deleteWorkOrder(@PathVariable Long id) {
        maintenanceService.deleteWorkOrder(id);
        return ResponseEntity.noContent().build();
    }

    /* ---------- Queries ---------- */

    @GetMapping("/asset/{assetId}")
    public ResponseEntity<List<WorkOrderDTO>> getByAsset(@PathVariable Long assetId) {
        return ResponseEntity.ok(
                maintenanceService.getWorkOrdersByAssetId(assetId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<WorkOrderDTO>> getByStatus(
            @PathVariable WorkOrder.WorkOrderStatus status) {
        return ResponseEntity.ok(
                maintenanceService.getWorkOrdersByStatus(status));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<WorkOrderDTO>> overdue() {
        return ResponseEntity.ok(
                maintenanceService.getOverdueWorkOrders());
    }

    /* ---------- Lifecycle ---------- */

    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<WorkOrderDTO> updateStatus(
            @PathVariable Long id,
            @PathVariable WorkOrder.WorkOrderStatus status) {
        return ResponseEntity.ok(
                maintenanceService.updateStatus(id, status));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<WorkOrderDTO> start(@PathVariable Long id) {
        return ResponseEntity.ok(
                maintenanceService.startWorkOrder(id));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<WorkOrderDTO> complete(
            @PathVariable Long id,
            @RequestParam(required = false) String completionNotes,
            @RequestParam(required = false) Double actualCost) {

        return ResponseEntity.ok(
                maintenanceService.completeWorkOrder(id, completionNotes, actualCost));
    }

    /* ---------- Utilities ---------- */

    @PostMapping("/validate")
    @PreAuthorize("hasRole('PLANNER')")
    public ResponseEntity<WorkOrderValidationResult> validate(
            @Valid @RequestBody WorkOrderDTO dto) {

        return ResponseEntity.ok(
                maintenanceService.validateWorkOrder(dto));
    }

    @GetMapping("/generate-number")
    @PreAuthorize("hasRole('PLANNER')")
    public ResponseEntity<Map<String, String>> generateNumber() {

        Map<String, String> response = new HashMap<>();
        response.put(
                "workOrderNumber",
                maintenanceService.generateWorkOrderNumber());

        return ResponseEntity.ok(response);
    }

    /* ======================================================
       US012 – Planning APIs (US009 entity ONLY)
       ====================================================== */

    @GetMapping("/planning/calendar")
    @PreAuthorize("hasRole('PLANNER')")
    public ResponseEntity<List<WorkOrder>> getCalendarPlanLoad(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end) {

        return ResponseEntity.ok(
                planningService.getCalendarPlanLoad(start, end));
    }

    @GetMapping("/planning/plan-load-summary")
    @PreAuthorize("hasRole('PLANNER')")
    public ResponseEntity<Map<String, Long>> getPlanLoadSummary() {
        return ResponseEntity.ok(
                planningService.getPlanLoadSummary());
    }

    @PatchMapping("/planning/{id}/status")
    @PreAuthorize("hasRole('PLANNER')")
    public ResponseEntity<WorkOrder> updatePlanningStatus(
            @PathVariable Long id,
            @RequestParam WorkOrder.WorkOrderStatus status) {

        return ResponseEntity.ok(
                planningService.updateWorkOrderStatus(id, status));
    }
}