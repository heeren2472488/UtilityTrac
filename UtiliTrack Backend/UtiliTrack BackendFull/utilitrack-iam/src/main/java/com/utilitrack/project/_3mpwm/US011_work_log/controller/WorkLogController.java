package com.utilitrack.project._3mpwm.US011_work_log.controller;

import com.utilitrack.project.entity.WorkLog;
import com.utilitrack.project._3mpwm.US011_work_log.service.WorkLogService;
import com.utilitrack.project.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WorkLogController {

    private final WorkLogService workLogService;

    // AC1 + AC2: Log work details for a specific work order
    @PostMapping("/work-orders/{workOrderId}/work-logs")
    public ResponseEntity<ApiResponse<WorkLog>> logWork(
            @PathVariable Long workOrderId,
            @RequestBody WorkLog workLog) {

        WorkLog saved = workLogService.logWork(workOrderId, workLog);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Work details logged and saved accurately.", saved));
    }
    // ✅ Get ALL work logs (admin / review)
    @GetMapping("/work-logs")
    public ResponseEntity<ApiResponse<List<WorkLog>>> getAllWorkLogs() {

        List<WorkLog> logs = workLogService.getAllWorkLogs();

        return ResponseEntity.ok(
                ApiResponse.success("All work logs retrieved.", logs)
        );
    }


    // AC3: Get all work logs for a work order
    @GetMapping("/work-orders/{workOrderId}/work-logs")
    public ResponseEntity<ApiResponse<List<WorkLog>>> getLogsForWorkOrder(
            @PathVariable Long workOrderId) {

        List<WorkLog> logs = workLogService.getLogsByWorkOrder(workOrderId);

        return ResponseEntity.ok(
                ApiResponse.success("Work logs retrieved for review.", logs));
    }

    // AC3: Get a specific work log by ID
    @GetMapping("/work-logs/{workLogId}")
    public ResponseEntity<ApiResponse<WorkLog>> getWorkLog(
            @PathVariable Long workLogId) {

        WorkLog log = workLogService.getLogById(workLogId);

        return ResponseEntity.ok(
                ApiResponse.success("Work log retrieved.", log));
    }

    // Update a work log
    @PutMapping("/work-logs/{workLogId}")
    public ResponseEntity<ApiResponse<WorkLog>> updateWorkLog(
            @PathVariable Long workLogId,
            @RequestBody WorkLog workLog) {

        WorkLog updated = workLogService.updateWorkLog(workLogId, workLog);

        return ResponseEntity.ok(
                ApiResponse.success("Work log updated successfully.", updated));
    }
}