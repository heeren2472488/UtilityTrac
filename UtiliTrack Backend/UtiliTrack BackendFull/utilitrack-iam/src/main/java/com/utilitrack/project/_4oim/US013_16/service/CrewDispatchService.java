package com.utilitrack.project._4oim.US013_16.service;

import com.utilitrack.project._4oim.US013_16.dto.*;
import com.utilitrack.project._4oim.US013_16.entity.CrewDispatch;
import com.utilitrack.project._4oim.US013_16.entity.Outage;
import com.utilitrack.project._4oim.US013_16.repository.CrewDispatchRepository;
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
 * CrewDispatchService
 * Service layer for crew dispatch operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrewDispatchService {
    
    private final CrewDispatchRepository crewDispatchRepository;
    private final OutageIncidentRepository outageIncidentRepository;
    
    /**
     * Dispatch a crew to an outage
     * @param request DispatchCrewRequest containing crew details
     * @param operatorId Operator ID performing the dispatch
     * @return CrewDispatchResponse with dispatch details
     */
    public CrewDispatchResponse dispatchCrew(DispatchCrewRequest request, String operatorId) {
        log.info("Dispatching crew {} to outage {}", request.getCrewId(), request.getOutageId());
        
        // Verify outage exists
        Outage outage = outageIncidentRepository.findById(request.getOutageId())
            .orElseThrow(() -> new RuntimeException("Outage not found with ID: " + request.getOutageId()));
        
        // Create crew dispatch
        CrewDispatch crewDispatch = CrewDispatch.builder()
            .outageId(request.getOutageId())
            .crewId(request.getCrewId())
            .crewName(request.getCrewName())
            .estimatedTimeOfArrival(request.getEstimatedTimeOfArrival())
            .dispatchedByOperatorId(operatorId)
            .specialInstructions(request.getSpecialInstructions())
            .crewSkills(request.getCrewSkills())
            .dispatchStatus(CrewDispatch.DispatchStatus.DISPATCHED)
            .build();
        
        CrewDispatch savedDispatch = crewDispatchRepository.save(crewDispatch);
        
        // Update outage status to DISPATCHED
        outage.setStatus(Outage.OutageStatus.DISPATCHED);
        outage.setDispatchedTime(LocalDateTime.now());
        outage.setDispatchId(savedDispatch.getId());
        outageIncidentRepository.save(outage);
        
        log.info("Crew {} dispatched successfully with dispatch ID: {}", 
            request.getCrewId(), savedDispatch.getId());
        
        return mapToCrewDispatchResponse(savedDispatch);
    }
    
    /**
     * Get crew dispatch by ID
     */
    public CrewDispatchResponse getCrewDispatchById(Long id) {
        log.debug("Fetching crew dispatch with ID: {}", id);
        return crewDispatchRepository.findById(id)
            .map(this::mapToCrewDispatchResponse)
            .orElseThrow(() -> new RuntimeException("Crew dispatch not found with ID: " + id));
    }
    
    /**
     * Get all crew dispatches for an outage
     */
    public List<CrewDispatchResponse> getCrewDispatchesByOutageId(Long outageId) {
        log.debug("Fetching crew dispatches for outage: {}", outageId);
        return crewDispatchRepository.findByOutageId(outageId).stream()
            .map(this::mapToCrewDispatchResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get crew dispatches with pagination
     */
    public Page<CrewDispatchResponse> getAllCrewDispatches(Pageable pageable) {
        log.debug("Fetching all crew dispatches with pagination");
        return crewDispatchRepository.findAll(pageable)
            .map(this::mapToCrewDispatchResponse);
    }
    
    /**
     * Get crew dispatches by status
     */
    public Page<CrewDispatchResponse> getCrewDispatchesByStatus(CrewDispatch.DispatchStatus status, Pageable pageable) {
        log.debug("Fetching crew dispatches with status: {}", status);
        return crewDispatchRepository.findByDispatchStatus(status, pageable)
            .map(this::mapToCrewDispatchResponse);
    }
    
    /**
     * Update crew dispatch status
     */
    public CrewDispatchResponse updateDispatchStatus(Long id, UpdateDispatchStatusRequest request) {
        log.info("Updating crew dispatch {} status to: {}", id, request.getDispatchStatus());
        
        CrewDispatch crewDispatch = crewDispatchRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Crew dispatch not found with ID: " + id));
        
        CrewDispatch.DispatchStatus newStatus = CrewDispatch.DispatchStatus.valueOf(request.getDispatchStatus());
        crewDispatch.setDispatchStatus(newStatus);
        
        if (request.getActualArrivalTime() != null) {
            crewDispatch.setActualArrivalTime(request.getActualArrivalTime());
        }
        
        if (request.getCompletionTime() != null) {
            crewDispatch.setCompletionTime(request.getCompletionTime());
        }
        
        // Update outage status if dispatch is in progress
        if (newStatus == CrewDispatch.DispatchStatus.IN_PROGRESS) {
            Outage outage = outageIncidentRepository.findById(crewDispatch.getOutageId())
                .orElseThrow(() -> new RuntimeException("Outage not found"));
            outage.setStatus(Outage.OutageStatus.IN_PROGRESS);
            outageIncidentRepository.save(outage);
        }
        
        CrewDispatch updatedDispatch = crewDispatchRepository.save(crewDispatch);
        log.info("Crew dispatch {} status updated successfully", id);
        
        return mapToCrewDispatchResponse(updatedDispatch);
    }
    
    /**
     * Get active crew dispatches
     */
    public List<CrewDispatchResponse> getActiveCrewDispatches() {
        log.debug("Fetching active crew dispatches");
        return crewDispatchRepository.findAllActiveDispatches().stream()
            .map(this::mapToCrewDispatchResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get crew dispatches by crew ID
     */
    public List<CrewDispatchResponse> getCrewDispatchesByCrewId(String crewId) {
        log.debug("Fetching dispatches for crew: {}", crewId);
        return crewDispatchRepository.findByCrewId(crewId).stream()
            .map(this::mapToCrewDispatchResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Map CrewDispatch entity to CrewDispatchResponse DTO
     */
    private CrewDispatchResponse mapToCrewDispatchResponse(CrewDispatch crewDispatch) {
        return CrewDispatchResponse.builder()
            .id(crewDispatch.getId())
            .outageId(crewDispatch.getOutageId())
            .crewId(crewDispatch.getCrewId())
            .crewName(crewDispatch.getCrewName())
            .estimatedTimeOfArrival(crewDispatch.getEstimatedTimeOfArrival())
            .dispatchTime(crewDispatch.getDispatchTime())
            .dispatchStatus(crewDispatch.getDispatchStatus().toString())
            .dispatchedByOperatorId(crewDispatch.getDispatchedByOperatorId())
            .specialInstructions(crewDispatch.getSpecialInstructions())
            .actualArrivalTime(crewDispatch.getActualArrivalTime())
            .crewSkills(crewDispatch.getCrewSkills())
            .build();
    }
}
