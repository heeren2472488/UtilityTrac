package com.utilitrack.project._4oim.US013_16.controller;

import com.utilitrack.project._4oim.US013_16.dto.*;
import com.utilitrack.project._4oim.US013_16.entity.Outage;
import com.utilitrack.project._4oim.US013_16.service.OutageService;
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
 * OutageController
 * REST API endpoints for outage management
 */
@RestController
@RequestMapping("/v1/outages")
@RequiredArgsConstructor
@Slf4j
public class OutageController {
    
    private final OutageService outageService;
    
    /**
     * Log a new outage
     * POST /api/v1/outages/log
     */
    @PostMapping("/log")
    public ResponseEntity<ApiResponse<OutageResponse>> logOutage(
            @Valid @RequestBody LogOutageRequest request,
            Authentication authentication) {
        log.info("Received request to log outage");
        
        String operatorId = authentication.getName();
        OutageResponse response = outageService.logOutage(request, operatorId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.<OutageResponse>builder()
                .status(201)
                .message("Outage logged successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get outage by ID
     * GET /api/v1/outages/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OutageResponse>> getOutageById(@PathVariable Long id) {
        log.debug("Fetching outage with ID: {}", id);
        
        OutageResponse response = outageService.getOutageById(id);
        
        return ResponseEntity.ok(
            ApiResponse.<OutageResponse>builder()
                .status(200)
                .message("Outage retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get all outages
     * GET /api/v1/outages
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<OutageResponse>>> getAllOutages(Pageable pageable) {
        log.debug("Fetching all outages");
        
        Page<OutageResponse> response = outageService.getAllOutages(pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<OutageResponse>>builder()
                .status(200)
                .message("Outages retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get outages by region
     * GET /api/v1/outages/region/{region}
     */
    @GetMapping("/region/{region}")
    public ResponseEntity<ApiResponse<List<OutageResponse>>> getOutagesByRegion(@PathVariable String region) {
        log.debug("Fetching outages for region: {}", region);
        
        List<OutageResponse> response = outageService.getOutagesByRegion(region);
        
        return ResponseEntity.ok(
            ApiResponse.<List<OutageResponse>>builder()
                .status(200)
                .message("Outages retrieved successfully for region: " + region)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get outages by status
     * GET /api/v1/outages/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<OutageResponse>>> getOutagesByStatus(
            @PathVariable String status,
            Pageable pageable) {
        log.debug("Fetching outages with status: {}", status);
        
        Outage.OutageStatus outageStatus = Outage.OutageStatus.valueOf(status);
        Page<OutageResponse> response = outageService.getOutagesByStatus(outageStatus, pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<OutageResponse>>builder()
                .status(200)
                .message("Outages retrieved successfully with status: " + status)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Update outage status
     * PUT /api/v1/outages/{id}/status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OutageResponse>> updateOutageStatus(
            @PathVariable Long id,
            @Valid @RequestBody OutageUpdateStatusRequest request) {
        log.info("Updating outage {} status", id);
        
        OutageResponse response = outageService.updateOutageStatus(id, request);
        
        return ResponseEntity.ok(
            ApiResponse.<OutageResponse>builder()
                .status(200)
                .message("Outage status updated successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get unresolved outages
     * GET /api/v1/outages/unresolved
     */
    @GetMapping("/unresolved")
    public ResponseEntity<ApiResponse<List<OutageResponse>>> getUnresolvedOutages() {
        log.debug("Fetching unresolved outages");
        
        List<OutageResponse> response = outageService.getUnresolvedOutages();
        
        return ResponseEntity.ok(
            ApiResponse.<List<OutageResponse>>builder()
                .status(200)
                .message("Unresolved outages retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
}
