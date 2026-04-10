package com.utilitrack.project._4oim.US013_16.controller;

import com.utilitrack.project._4oim.US013_16.dto.*;
import com.utilitrack.project._4oim.US013_16.entity.IncidentReport;
import com.utilitrack.project._4oim.US013_16.service.IncidentReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * IncidentReportController
 * REST API endpoints for incident report management
 */
@RestController
@RequestMapping("/v1/incident-reports")
@RequiredArgsConstructor
@Slf4j
public class IncidentReportController {
    
    private final IncidentReportService incidentReportService;
    
    /**
     * Create a new incident report
     * POST /api/v1/incident-reports
     */
    @PostMapping
    public ResponseEntity<ApiResponse<IncidentReportResponse>> createIncidentReport(
            @Valid @RequestBody CreateIncidentReportRequest request,
            Authentication authentication) {
        log.info("Received request to create incident report");
        
        String analystId = authentication.getName();
        IncidentReportResponse response = incidentReportService.createIncidentReport(request, analystId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.<IncidentReportResponse>builder()
                .status(201)
                .message("Incident report created successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get incident report by ID
     * GET /api/v1/incident-reports/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentReportResponse>> getIncidentReportById(@PathVariable Long id) {
        log.debug("Fetching incident report with ID: {}", id);
        
        IncidentReportResponse response = incidentReportService.getIncidentReportById(id);
        
        return ResponseEntity.ok(
            ApiResponse.<IncidentReportResponse>builder()
                .status(200)
                .message("Incident report retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get all incident reports
     * GET /api/v1/incident-reports
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<IncidentReportResponse>>> getAllIncidentReports(Pageable pageable) {
        log.debug("Fetching all incident reports");
        
        Page<IncidentReportResponse> response = incidentReportService.getAllIncidentReports(pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<IncidentReportResponse>>builder()
                .status(200)
                .message("Incident reports retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get incident reports by outage ID
     * GET /api/v1/incident-reports/outage/{outageId}
     */
    @GetMapping("/outage/{outageId}")
    public ResponseEntity<ApiResponse<List<IncidentReportResponse>>> getIncidentReportsByOutageId(
            @PathVariable Long outageId) {
        log.debug("Fetching incident reports for outage: {}", outageId);
        
        List<IncidentReportResponse> response = incidentReportService.getIncidentReportsByOutageId(outageId);
        
        return ResponseEntity.ok(
            ApiResponse.<List<IncidentReportResponse>>builder()
                .status(200)
                .message("Incident reports retrieved successfully for outage: " + outageId)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get incident reports by analyst
     * GET /api/v1/incident-reports/analyst/{analystId}
     */
    @GetMapping("/analyst/{analystId}")
    public ResponseEntity<ApiResponse<Page<IncidentReportResponse>>> getIncidentReportsByAnalystId(
            @PathVariable String analystId,
            Pageable pageable) {
        log.debug("Fetching incident reports by analyst: {}", analystId);
        
        Page<IncidentReportResponse> response = incidentReportService.getIncidentReportsByAnalystId(analystId, pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<IncidentReportResponse>>builder()
                .status(200)
                .message("Incident reports retrieved successfully for analyst: " + analystId)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get incident reports by status
     * GET /api/v1/incident-reports/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<IncidentReportResponse>>> getIncidentReportsByStatus(
            @PathVariable String status,
            Pageable pageable) {
        log.debug("Fetching incident reports with status: {}", status);
        
        IncidentReport.ReportStatus reportStatus = IncidentReport.ReportStatus.valueOf(status);
        Page<IncidentReportResponse> response = incidentReportService.getIncidentReportsByStatus(reportStatus, pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<IncidentReportResponse>>builder()
                .status(200)
                .message("Incident reports retrieved successfully with status: " + status)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Update incident report
     * PUT /api/v1/incident-reports/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentReportResponse>> updateIncidentReport(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIncidentReportRequest request,
            Authentication authentication) {
        log.info("Updating incident report {}", id);
        
        String analystId = authentication.getName();
        IncidentReportResponse response = incidentReportService.updateIncidentReport(id, request, analystId);
        
        return ResponseEntity.ok(
            ApiResponse.<IncidentReportResponse>builder()
                .status(200)
                .message("Incident report updated successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Submit incident report
     * POST /api/v1/incident-reports/{id}/submit
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<IncidentReportResponse>> submitIncidentReport(@PathVariable Long id) {
        log.info("Submitting incident report {}", id);
        
        IncidentReportResponse response = incidentReportService.submitIncidentReport(id);
        
        return ResponseEntity.ok(
            ApiResponse.<IncidentReportResponse>builder()
                .status(200)
                .message("Incident report submitted successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Approve incident report
     * POST /api/v1/incident-reports/{id}/approve
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<IncidentReportResponse>> approveIncidentReport(@PathVariable Long id) {
        log.info("Approving incident report {}", id);
        
        IncidentReportResponse response = incidentReportService.approveIncidentReport(id);
        
        return ResponseEntity.ok(
            ApiResponse.<IncidentReportResponse>builder()
                .status(200)
                .message("Incident report approved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Reject incident report
     * POST /api/v1/incident-reports/{id}/reject
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<IncidentReportResponse>> rejectIncidentReport(@PathVariable Long id) {
        log.info("Rejecting incident report {}", id);
        
        IncidentReportResponse response = incidentReportService.rejectIncidentReport(id);
        
        return ResponseEntity.ok(
            ApiResponse.<IncidentReportResponse>builder()
                .status(200)
                .message("Incident report rejected successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get high severity incident reports
     * GET /api/v1/incident-reports/high-severity
     */
    @GetMapping("/high-severity")
    public ResponseEntity<ApiResponse<List<IncidentReportResponse>>> getHighSeverityReports() {
        log.debug("Fetching high severity incident reports");
        
        List<IncidentReportResponse> response = incidentReportService.getHighSeverityReports();
        
        return ResponseEntity.ok(
            ApiResponse.<List<IncidentReportResponse>>builder()
                .status(200)
                .message("High severity incident reports retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get submitted incident reports
     * GET /api/v1/incident-reports/submitted
     */
    @GetMapping("/submitted")
    public ResponseEntity<ApiResponse<Page<IncidentReportResponse>>> getSubmittedReports(Pageable pageable) {
        log.debug("Fetching submitted incident reports");
        
        Page<IncidentReportResponse> response = incidentReportService.getSubmittedReports(pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<IncidentReportResponse>>builder()
                .status(200)
                .message("Submitted incident reports retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
}
