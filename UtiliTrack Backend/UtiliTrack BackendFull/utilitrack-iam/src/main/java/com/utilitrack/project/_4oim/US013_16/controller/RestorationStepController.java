package com.utilitrack.project._4oim.US013_16.controller;

import com.utilitrack.project._4oim.US013_16.dto.*;
import com.utilitrack.project._4oim.US013_16.entity.RestorationStep;
import com.utilitrack.project._4oim.US013_16.service.RestorationStepService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * RestorationStepController
 * REST API endpoints for restoration step management
 */
@RestController
@RequestMapping("/v1/restoration-steps")
@RequiredArgsConstructor
@Slf4j
public class RestorationStepController {
    
    private final RestorationStepService restorationStepService;
    
    /**
     * Create a new restoration step
     * POST /api/v1/restoration-steps
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RestorationStepResponse>> createRestorationStep(
            @Valid @RequestBody CreateRestorationStepRequest request) {
        log.info("Received request to create restoration step");
        
        RestorationStepResponse response = restorationStepService.createRestorationStep(request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.<RestorationStepResponse>builder()
                .status(201)
                .message("Restoration step created successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get restoration step by ID
     * GET /api/v1/restoration-steps/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RestorationStepResponse>> getRestorationStepById(@PathVariable Long id) {
        log.debug("Fetching restoration step with ID: {}", id);
        
        RestorationStepResponse response = restorationStepService.getRestorationStepById(id);
        
        return ResponseEntity.ok(
            ApiResponse.<RestorationStepResponse>builder()
                .status(200)
                .message("Restoration step retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get all restoration steps
     * GET /api/v1/restoration-steps
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<RestorationStepResponse>>> getAllRestorationSteps(Pageable pageable) {
        log.debug("Fetching all restoration steps");
        
        Page<RestorationStepResponse> response = restorationStepService.getAllRestorationSteps(pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<RestorationStepResponse>>builder()
                .status(200)
                .message("Restoration steps retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get restoration steps by outage ID
     * GET /api/v1/restoration-steps/outage/{outageId}
     */
    @GetMapping("/outage/{outageId}")
    public ResponseEntity<ApiResponse<List<RestorationStepResponse>>> getRestorationStepsByOutageId(
            @PathVariable Long outageId) {
        log.debug("Fetching restoration steps for outage: {}", outageId);
        
        List<RestorationStepResponse> response = restorationStepService.getRestorationStepsByOutageId(outageId);
        
        return ResponseEntity.ok(
            ApiResponse.<List<RestorationStepResponse>>builder()
                .status(200)
                .message("Restoration steps retrieved successfully for outage: " + outageId)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get restoration steps by status
     * GET /api/v1/restoration-steps/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<RestorationStepResponse>>> getRestorationStepsByStatus(
            @PathVariable String status,
            Pageable pageable) {
        log.debug("Fetching restoration steps with status: {}", status);
        
        RestorationStep.StepStatus stepStatus = RestorationStep.StepStatus.valueOf(status);
        Page<RestorationStepResponse> response = restorationStepService.getRestorationStepsByStatus(stepStatus, pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<RestorationStepResponse>>builder()
                .status(200)
                .message("Restoration steps retrieved successfully with status: " + status)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Update restoration step status
     * PUT /api/v1/restoration-steps/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RestorationStepResponse>> updateRestorationStepStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRestorationStepRequest request) {
        log.info("Updating restoration step {} status", id);
        
        RestorationStepResponse response = restorationStepService.updateRestorationStepStatus(id, request);
        
        return ResponseEntity.ok(
            ApiResponse.<RestorationStepResponse>builder()
                .status(200)
                .message("Restoration step status updated successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get incomplete restoration steps for an outage
     * GET /api/v1/restoration-steps/outage/{outageId}/incomplete
     */
    @GetMapping("/outage/{outageId}/incomplete")
    public ResponseEntity<ApiResponse<List<RestorationStepResponse>>> getIncompleteSteps(
            @PathVariable Long outageId) {
        log.debug("Fetching incomplete restoration steps for outage: {}", outageId);
        
        List<RestorationStepResponse> response = restorationStepService.getIncompleteSteps(outageId);
        
        return ResponseEntity.ok(
            ApiResponse.<List<RestorationStepResponse>>builder()
                .status(200)
                .message("Incomplete restoration steps retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get restoration progress for an outage
     * GET /api/v1/restoration-steps/outage/{outageId}/progress
     */
    @GetMapping("/outage/{outageId}/progress")
    public ResponseEntity<ApiResponse<RestorationProgressResponse>> getRestorationProgress(
            @PathVariable Long outageId) {
        log.debug("Fetching restoration progress for outage: {}", outageId);
        
        RestorationProgressResponse response = restorationStepService.getRestorationProgress(outageId);
        
        return ResponseEntity.ok(
            ApiResponse.<RestorationProgressResponse>builder()
                .status(200)
                .message("Restoration progress retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
}
