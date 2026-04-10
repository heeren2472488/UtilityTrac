package com.utilitrack.project._4oim.US013_16.service;

import com.utilitrack.project._4oim.US013_16.dto.*;
import com.utilitrack.project._4oim.US013_16.entity.RestorationStep;
import com.utilitrack.project._4oim.US013_16.repository.RestorationStepRepository;
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
 * RestorationStepService
 * Service layer for restoration step operations
 * Tracks restoration progress with clear status transitions
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RestorationStepService {
    
    private final RestorationStepRepository restorationStepRepository;
    
    /**
     * Create a new restoration step
     * @param request CreateRestorationStepRequest containing step details
     * @return RestorationStepResponse with created step details
     */
    public RestorationStepResponse createRestorationStep(CreateRestorationStepRequest request) {
        log.info("Creating restoration step for outage: {}", request.getOutageId());
        
        RestorationStep step = RestorationStep.builder()
            .outageId(request.getOutageId())
            .stepSequence(request.getStepSequence())
            .stepName(request.getStepName())
            .description(request.getDescription())
            .assignedToOperatorId(request.getAssignedToOperatorId())
            .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
            .priority(request.getPriority())
            .stepStatus(RestorationStep.StepStatus.PLANNED)
            .build();
        
        RestorationStep savedStep = restorationStepRepository.save(step);
        log.info("Restoration step created with ID: {}", savedStep.getId());
        
        return mapToRestorationStepResponse(savedStep);
    }
    
    /**
     * Get restoration step by ID
     */
    public RestorationStepResponse getRestorationStepById(Long id) {
        log.debug("Fetching restoration step with ID: {}", id);
        return restorationStepRepository.findById(id)
            .map(this::mapToRestorationStepResponse)
            .orElseThrow(() -> new RuntimeException("Restoration step not found with ID: " + id));
    }
    
    /**
     * Get all restoration steps for an outage
     */
    public List<RestorationStepResponse> getRestorationStepsByOutageId(Long outageId) {
        log.debug("Fetching restoration steps for outage: {}", outageId);
        return restorationStepRepository.findByOutageIdOrderBySequence(outageId).stream()
            .map(this::mapToRestorationStepResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get restoration steps with pagination
     */
    public Page<RestorationStepResponse> getAllRestorationSteps(Pageable pageable) {
        log.debug("Fetching all restoration steps with pagination");
        return restorationStepRepository.findAll(pageable)
            .map(this::mapToRestorationStepResponse);
    }
    
    /**
     * Get restoration steps by status
     */
    public Page<RestorationStepResponse> getRestorationStepsByStatus(RestorationStep.StepStatus status, Pageable pageable) {
        log.debug("Fetching restoration steps with status: {}", status);
        return restorationStepRepository.findByStepStatus(status, pageable)
            .map(this::mapToRestorationStepResponse);
    }
    
    /**
     * Update restoration step status
     */
    public RestorationStepResponse updateRestorationStepStatus(Long id, UpdateRestorationStepRequest request) {
        log.info("Updating restoration step {} status to: {}", id, request.getStepStatus());
        
        RestorationStep step = restorationStepRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Restoration step not found with ID: " + id));
        
        RestorationStep.StepStatus newStatus = RestorationStep.StepStatus.valueOf(request.getStepStatus());
        step.setStepStatus(newStatus);
        
        if (newStatus == RestorationStep.StepStatus.IN_PROGRESS && step.getStartedTime() == null) {
            step.setStartedTime(LocalDateTime.now());
        } else if (newStatus == RestorationStep.StepStatus.COMPLETED && step.getCompletedTime() == null) {
            step.setCompletedTime(LocalDateTime.now());
        }
        
        if (request.getProgressNotes() != null) {
            step.setProgressNotes(request.getProgressNotes());
        }
        
        if (request.getActualDurationMinutes() != null) {
            step.setActualDurationMinutes(request.getActualDurationMinutes());
        }
        
        RestorationStep updatedStep = restorationStepRepository.save(step);
        log.info("Restoration step {} status updated successfully", id);
        
        return mapToRestorationStepResponse(updatedStep);
    }
    
    /**
     * Get incomplete restoration steps for an outage
     */
    public List<RestorationStepResponse> getIncompleteSteps(Long outageId) {
        log.debug("Fetching incomplete restoration steps for outage: {}", outageId);
        return restorationStepRepository.findIncompleteStepsByOutageId(outageId).stream()
            .map(this::mapToRestorationStepResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get restoration progress for an outage
     */
    public RestorationProgressResponse getRestorationProgress(Long outageId) {
        log.debug("Calculating restoration progress for outage: {}", outageId);
        
        long totalSteps = restorationStepRepository.countByOutageId(outageId);
        long completedSteps = restorationStepRepository.countCompletedStepsByOutageId(outageId);
        
        int progressPercentage = 0;
        if (totalSteps > 0) {
            progressPercentage = (int) ((completedSteps * 100) / totalSteps);
        }
        
        return RestorationProgressResponse.builder()
            .outageId(outageId)
            .totalSteps(totalSteps)
            .completedSteps(completedSteps)
            .progressPercentage(progressPercentage)
            .build();
    }
    
    /**
     * Get restoration steps assigned to an operator
     */
    public List<RestorationStepResponse> getRestorationStepsByOperatorId(String operatorId) {
        log.debug("Fetching restoration steps assigned to operator: {}", operatorId);
        return restorationStepRepository.findByAssignedToOperatorId(operatorId).stream()
            .map(this::mapToRestorationStepResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Map RestorationStep entity to RestorationStepResponse DTO
     */
    private RestorationStepResponse mapToRestorationStepResponse(RestorationStep step) {
        return RestorationStepResponse.builder()
            .id(step.getId())
            .outageId(step.getOutageId())
            .stepSequence(step.getStepSequence())
            .stepName(step.getStepName())
            .description(step.getDescription())
            .stepStatus(step.getStepStatus().toString())
            .assignedToOperatorId(step.getAssignedToOperatorId())
            .createdTime(step.getCreatedTime())
            .startedTime(step.getStartedTime())
            .completedTime(step.getCompletedTime())
            .progressNotes(step.getProgressNotes())
            .estimatedDurationMinutes(step.getEstimatedDurationMinutes())
            .actualDurationMinutes(step.getActualDurationMinutes())
            .priority(step.getPriority())
            .build();
    }
}
