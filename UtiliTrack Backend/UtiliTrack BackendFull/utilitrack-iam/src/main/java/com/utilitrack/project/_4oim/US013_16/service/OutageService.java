package com.utilitrack.project._4oim.US013_16.service;

import com.utilitrack.project._4oim.US013_16.dto.*;
import com.utilitrack.project._4oim.US013_16.entity.Outage;
import com.utilitrack.project._4oim.US013_16.repository.OutageIncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * OutageService
 * Service layer for outage operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OutageService {
    
    private final OutageIncidentRepository outageIncidentRepository;
    
    /**
     * Log a new outage
     * @param request LogOutageRequest containing outage details
     * @param operatorId Operator ID who is logging the outage
     * @return OutageResponse with created outage details
     */
    public OutageResponse logOutage(LogOutageRequest request, String operatorId) {
        log.info("Logging new outage in region: {} by operator: {}", request.getRegion(), operatorId);
        
        Outage outage = Outage.builder()
            .region(request.getRegion())
            .outageTime(request.getOutageTime())
            .cause(request.getCause())
            .notes(request.getNotes())
            .affectedCustomers(request.getAffectedCustomers())
            .severityLevel(request.getSeverityLevel())
            .loggedByOperatorId(operatorId)
            .status(Outage.OutageStatus.LOGGED)
            .build();
        
        Outage savedOutage = outageIncidentRepository.save(outage);
        log.info("Outage logged successfully with ID: {}", savedOutage.getId());
        
        return mapToOutageResponse(savedOutage);
    }
    
    /**
     * Get outage by ID
     */
    public OutageResponse getOutageById(Long id) {
        log.debug("Fetching outage with ID: {}", id);
        return outageIncidentRepository.findById(id)
            .map(this::mapToOutageResponse)
            .orElseThrow(() -> new RuntimeException("Outage not found with ID: " + id));
    }
    
    /**
     * Get all outages by region
     */
    public List<OutageResponse> getOutagesByRegion(String region) {
        log.debug("Fetching outages for region: {}", region);
        return outageIncidentRepository.findByRegion(region).stream()
            .map(this::mapToOutageResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get all outages with pagination
     */
    public Page<OutageResponse> getAllOutages(Pageable pageable) {
        log.debug("Fetching all outages with pagination");
        return outageIncidentRepository.findAll(pageable)
            .map(this::mapToOutageResponse);
    }
    
    /**
     * Get outages by status
     */
    public Page<OutageResponse> getOutagesByStatus(Outage.OutageStatus status, Pageable pageable) {
        log.debug("Fetching outages with status: {}", status);
        return outageIncidentRepository.findByStatus(status, pageable)
            .map(this::mapToOutageResponse);
    }
    
    /**
     * Update outage status
     */
    public OutageResponse updateOutageStatus(Long id, OutageUpdateStatusRequest request) {
        log.info("Updating outage {} status to: {}", id, request.getStatus());
        
        Outage outage = outageIncidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Outage not found with ID: " + id));
        
        Outage.OutageStatus newStatus = Outage.OutageStatus.valueOf(request.getStatus());
        outage.setStatus(newStatus);
        
        if (newStatus == Outage.OutageStatus.DISPATCHED) {
            outage.setDispatchedTime(LocalDateTime.now());
        } else if (newStatus == Outage.OutageStatus.RESTORED) {
            outage.setRestoredTime(LocalDateTime.now());
        }
        
        if (request.getNotes() != null) {
            outage.setNotes(request.getNotes());
        }
        
        Outage updatedOutage = outageIncidentRepository.save(outage);
        log.info("Outage {} status updated successfully", id);
        
        return mapToOutageResponse(updatedOutage);
    }
    
    /**
     * Get unresolved outages
     */
    public List<OutageResponse> getUnresolvedOutages() {
        log.debug("Fetching unresolved outages");
        return outageIncidentRepository.findAllUnresolvedOutages().stream()
            .map(this::mapToOutageResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get outages by time range
     */
    public List<OutageResponse> getOutagesByTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        log.debug("Fetching outages between {} and {}", startTime, endTime);
        return outageIncidentRepository.findByLoggedTimeBetween(startTime, endTime).stream()
            .map(this::mapToOutageResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Count outages by status
     */
    public long countOutagesByStatus(Outage.OutageStatus status) {
        log.debug("Counting outages with status: {}", status);
        return outageIncidentRepository.countByStatus(status);
    }
    
    /**
     * Map Outage entity to OutageResponse DTO
     */
    private OutageResponse mapToOutageResponse(Outage outage) {
        return OutageResponse.builder()
            .id(outage.getId())
            .region(outage.getRegion())
            .outageTime(outage.getOutageTime())
            .cause(outage.getCause())
            .loggedTime(outage.getLoggedTime())
            .status(outage.getStatus().toString())
            .loggedByOperatorId(outage.getLoggedByOperatorId())
            .notes(outage.getNotes())
            .affectedCustomers(outage.getAffectedCustomers())
            .severityLevel(outage.getSeverityLevel())
            .build();
    }
}
