package com.utilitrack.project._1iam.US004_audit_logs.controller;

import com.utilitrack.project._1iam.US004_audit_logs.dto.AuditLogResponse;
import com.utilitrack.project._1iam.US004_audit_logs.service.AuditLogService;
import com.utilitrack.project.common.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

/**
 * US004: Audit Log Controller (TEAM-60)
 * GET /api/iam/audit-logs — Admin only, paginated, filterable
 *
 * Filters (TEAM-60):
 *  ?actorEmail=admin@x.com
 *  ?action=LOGIN
 *  ?from=2026-01-01T00:00:00
 *  ?to=2026-12-31T23:59:59
 *  ?page=0&size=20
 */
@RestController
@RequestMapping("/api/iam/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogResponse>>> getLogs(
            @RequestParam(required = false) String actorEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        PagedResponse<AuditLogResponse> result = auditLogService.getLogs(
                actorEmail, action, from, to,
                PageRequest.of(page, size, Sort.by("performedAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
