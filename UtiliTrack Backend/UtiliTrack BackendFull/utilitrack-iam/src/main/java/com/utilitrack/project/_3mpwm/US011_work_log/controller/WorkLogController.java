package com.utilitrack.project._3mpwm.US011_work_log.controller;

import com.utilitrack.project._3mpwm.US011_work_log.dto.WorkLogRequestDTO;
import com.utilitrack.project._3mpwm.US011_work_log.dto.WorkLogResponseDTO;
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

    /* ===============================
       CREATE
       =============================== */
    @PostMapping("/work-orders/{workOrderId}/work-logs")
    public ResponseEntity<ApiResponse<WorkLogResponseDTO>> logWork(
            @PathVariable Long workOrderId,
            @RequestBody WorkLogRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Work details logged and saved accurately.",
                        workLogService.logWork(workOrderId, request)
                ));
    }

    /* ===============================
       READ
       =============================== */

    @GetMapping("/work-logs")
    public ResponseEntity<ApiResponse<List<WorkLogResponseDTO>>> getAllWorkLogs() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "All work logs retrieved.",
                        workLogService.getAllWorkLogs()
                ));
    }

    @GetMapping("/work-orders/{workOrderId}/work-logs")
    public ResponseEntity<ApiResponse<List<WorkLogResponseDTO>>> getLogsForWorkOrder(
            @PathVariable Long workOrderId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Work logs retrieved for review.",
                        workLogService.getLogsByWorkOrder(workOrderId)
                ));
    }

    @GetMapping("/work-logs/{workLogId}")
    public ResponseEntity<ApiResponse<WorkLogResponseDTO>> getWorkLog(
            @PathVariable Long workLogId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Work log retrieved.",
                        workLogService.getLogById(workLogId)
                ));
    }

    /* ===============================
       UPDATE
       =============================== */
    @PutMapping("/work-logs/{workLogId}")
    public ResponseEntity<ApiResponse<WorkLogResponseDTO>> updateWorkLog(
            @PathVariable Long workLogId,
            @RequestBody WorkLogRequestDTO request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Work log updated successfully.",
                        workLogService.updateWorkLog(workLogId, request)
                ));
    }
}
