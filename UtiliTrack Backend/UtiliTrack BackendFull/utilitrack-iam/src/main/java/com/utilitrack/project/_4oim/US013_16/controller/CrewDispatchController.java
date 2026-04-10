package com.utilitrack.project._4oim.US013_16.controller;

import com.utilitrack.project._4oim.US013_16.dto.*;
import com.utilitrack.project._4oim.US013_16.entity.CrewDispatch;
import com.utilitrack.project._4oim.US013_16.service.CrewDispatchService;
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
 * CrewDispatchController
 * REST API endpoints for crew dispatch management
 */
@RestController
@RequestMapping("/v1/crew-dispatches")
@RequiredArgsConstructor
@Slf4j
public class CrewDispatchController {
    
    private final CrewDispatchService crewDispatchService;
    
    /**
     * Dispatch a crew to an outage
     * POST /api/v1/crew-dispatches
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CrewDispatchResponse>> dispatchCrew(
            @Valid @RequestBody DispatchCrewRequest request,
            Authentication authentication) {
        log.info("Received request to dispatch crew");
        
        String operatorId = authentication.getName();
        CrewDispatchResponse response = crewDispatchService.dispatchCrew(request, operatorId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.<CrewDispatchResponse>builder()
                .status(201)
                .message("Crew dispatched successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get crew dispatch by ID
     * GET /api/v1/crew-dispatches/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CrewDispatchResponse>> getCrewDispatchById(@PathVariable Long id) {
        log.debug("Fetching crew dispatch with ID: {}", id);
        
        CrewDispatchResponse response = crewDispatchService.getCrewDispatchById(id);
        
        return ResponseEntity.ok(
            ApiResponse.<CrewDispatchResponse>builder()
                .status(200)
                .message("Crew dispatch retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get all crew dispatches
     * GET /api/v1/crew-dispatches
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CrewDispatchResponse>>> getAllCrewDispatches(Pageable pageable) {
        log.debug("Fetching all crew dispatches");
        
        Page<CrewDispatchResponse> response = crewDispatchService.getAllCrewDispatches(pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<CrewDispatchResponse>>builder()
                .status(200)
                .message("Crew dispatches retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get crew dispatches by outage ID
     * GET /api/v1/crew-dispatches/outage/{outageId}
     */
    @GetMapping("/outage/{outageId}")
    public ResponseEntity<ApiResponse<List<CrewDispatchResponse>>> getCrewDispatchesByOutageId(
            @PathVariable Long outageId) {
        log.debug("Fetching crew dispatches for outage: {}", outageId);
        
        List<CrewDispatchResponse> response = crewDispatchService.getCrewDispatchesByOutageId(outageId);
        
        return ResponseEntity.ok(
            ApiResponse.<List<CrewDispatchResponse>>builder()
                .status(200)
                .message("Crew dispatches retrieved successfully for outage: " + outageId)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get crew dispatches by status
     * GET /api/v1/crew-dispatches/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<CrewDispatchResponse>>> getCrewDispatchesByStatus(
            @PathVariable String status,
            Pageable pageable) {
        log.debug("Fetching crew dispatches with status: {}", status);
        
        CrewDispatch.DispatchStatus dispatchStatus = CrewDispatch.DispatchStatus.valueOf(status);
        Page<CrewDispatchResponse> response = crewDispatchService.getCrewDispatchesByStatus(dispatchStatus, pageable);
        
        return ResponseEntity.ok(
            ApiResponse.<Page<CrewDispatchResponse>>builder()
                .status(200)
                .message("Crew dispatches retrieved successfully with status: " + status)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Update crew dispatch status
     * PUT /api/v1/crew-dispatches/{id}/status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CrewDispatchResponse>> updateDispatchStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDispatchStatusRequest request) {
        log.info("Updating crew dispatch {} status", id);
        
        CrewDispatchResponse response = crewDispatchService.updateDispatchStatus(id, request);
        
        return ResponseEntity.ok(
            ApiResponse.<CrewDispatchResponse>builder()
                .status(200)
                .message("Crew dispatch status updated successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get active crew dispatches
     * GET /api/v1/crew-dispatches/active
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CrewDispatchResponse>>> getActiveCrewDispatches() {
        log.debug("Fetching active crew dispatches");
        
        List<CrewDispatchResponse> response = crewDispatchService.getActiveCrewDispatches();
        
        return ResponseEntity.ok(
            ApiResponse.<List<CrewDispatchResponse>>builder()
                .status(200)
                .message("Active crew dispatches retrieved successfully")
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
    
    /**
     * Get crew dispatches by crew ID
     * GET /api/v1/crew-dispatches/crew/{crewId}
     */
    @GetMapping("/crew/{crewId}")
    public ResponseEntity<ApiResponse<List<CrewDispatchResponse>>> getCrewDispatchesByCrewId(
            @PathVariable String crewId) {
        log.debug("Fetching dispatches for crew: {}", crewId);
        
        List<CrewDispatchResponse> response = crewDispatchService.getCrewDispatchesByCrewId(crewId);
        
        return ResponseEntity.ok(
            ApiResponse.<List<CrewDispatchResponse>>builder()
                .status(200)
                .message("Crew dispatches retrieved successfully for crew: " + crewId)
                .data(response)
                .timestamp(System.currentTimeMillis())
                .build()
        );
    }
}
