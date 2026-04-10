package com.utilitrack.project._4oim.US013_16.service;

import com.utilitrack.project._4oim.US013_16.dto.*;
import com.utilitrack.project._4oim.US013_16.entity.IncidentReport;
import com.utilitrack.project._4oim.US013_16.repository.IncidentReportRepository;
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
 * IncidentReportService
 * Service layer for incident report operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class IncidentReportService {
    
    private final IncidentReportRepository incidentReportRepository;
    
    /**
     * Create a new incident report
     * @param request CreateIncidentReportRequest containing report details
     * @param analystId Analyst ID creating the report
     * @return IncidentReportResponse with created report details
     */
    public IncidentReportResponse createIncidentReport(CreateIncidentReportRequest request, String analystId) {
        log.info("Creating incident report for outage: {} by analyst: {}", request.getOutageId(), analystId);
        
        IncidentReport report = IncidentReport.builder()
            .outageId(request.getOutageId())
            .safetyDetails(request.getSafetyDetails())
            .rootCause(request.getRootCause())
            .correctiveActions(request.getCorrectiveActions())
            .severityLevel(request.getSeverityLevel())
            .recommendations(request.getRecommendations())
            .affectedSystem(request.getAffectedSystem())
            .estimatedRecoveryCost(request.getEstimatedRecoveryCost())
            .createdByAnalystId(analystId)
            .reportStatus(IncidentReport.ReportStatus.DRAFT)
            .build();
        
        IncidentReport savedReport = incidentReportRepository.save(report);
        log.info("Incident report created with ID: {}", savedReport.getId());
        
        return mapToIncidentReportResponse(savedReport);
    }
    
    /**
     * Get incident report by ID
     */
    public IncidentReportResponse getIncidentReportById(Long id) {
        log.debug("Fetching incident report with ID: {}", id);
        return incidentReportRepository.findById(id)
            .map(this::mapToIncidentReportResponse)
            .orElseThrow(() -> new RuntimeException("Incident report not found with ID: " + id));
    }
    
    /**
     * Get all incident reports for an outage
     */
    public List<IncidentReportResponse> getIncidentReportsByOutageId(Long outageId) {
        log.debug("Fetching incident reports for outage: {}", outageId);
        return incidentReportRepository.findByOutageId(outageId).stream()
            .map(this::mapToIncidentReportResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get incident reports with pagination
     */
    public Page<IncidentReportResponse> getAllIncidentReports(Pageable pageable) {
        log.debug("Fetching all incident reports with pagination");
        return incidentReportRepository.findAll(pageable)
            .map(this::mapToIncidentReportResponse);
    }
    
    /**
     * Get incident reports by analyst
     */
    public Page<IncidentReportResponse> getIncidentReportsByAnalystId(String analystId, Pageable pageable) {
        log.debug("Fetching incident reports created by analyst: {}", analystId);
        return incidentReportRepository.findByCreatedByAnalystId(analystId, pageable)
            .map(this::mapToIncidentReportResponse);
    }
    
    /**
     * Get incident reports by status
     */
    public Page<IncidentReportResponse> getIncidentReportsByStatus(IncidentReport.ReportStatus status, Pageable pageable) {
        log.debug("Fetching incident reports with status: {}", status);
        return incidentReportRepository.findByReportStatus(status, pageable)
            .map(this::mapToIncidentReportResponse);
    }
    
    /**
     * Update incident report
     */
    public IncidentReportResponse updateIncidentReport(Long id, UpdateIncidentReportRequest request, String analystId) {
        log.info("Updating incident report {} by analyst: {}", id, analystId);
        
        IncidentReport report = incidentReportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident report not found with ID: " + id));
        
        report.setSafetyDetails(request.getSafetyDetails());
        report.setRootCause(request.getRootCause());
        report.setCorrectiveActions(request.getCorrectiveActions());
        report.setSeverityLevel(request.getSeverityLevel());
        report.setRecommendations(request.getRecommendations());
        report.setAffectedSystem(request.getAffectedSystem());
        report.setEstimatedRecoveryCost(request.getEstimatedRecoveryCost());
        report.setLastModifiedByAnalystId(analystId);
        
        IncidentReport updatedReport = incidentReportRepository.save(report);
        log.info("Incident report {} updated successfully", id);
        
        return mapToIncidentReportResponse(updatedReport);
    }
    
    /**
     * Submit incident report
     */
    public IncidentReportResponse submitIncidentReport(Long id) {
        log.info("Submitting incident report: {}", id);
        
        IncidentReport report = incidentReportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident report not found with ID: " + id));
        
        report.setReportStatus(IncidentReport.ReportStatus.SUBMITTED);
        report.setSubmittedTime(LocalDateTime.now());
        
        IncidentReport updatedReport = incidentReportRepository.save(report);
        log.info("Incident report {} submitted successfully", id);
        
        return mapToIncidentReportResponse(updatedReport);
    }
    
    /**
     * Approve incident report
     */
    public IncidentReportResponse approveIncidentReport(Long id) {
        log.info("Approving incident report: {}", id);
        
        IncidentReport report = incidentReportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident report not found with ID: " + id));
        
        report.setReportStatus(IncidentReport.ReportStatus.APPROVED);
        
        IncidentReport updatedReport = incidentReportRepository.save(report);
        log.info("Incident report {} approved successfully", id);
        
        return mapToIncidentReportResponse(updatedReport);
    }
    
    /**
     * Reject incident report
     */
    public IncidentReportResponse rejectIncidentReport(Long id) {
        log.info("Rejecting incident report: {}", id);
        
        IncidentReport report = incidentReportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident report not found with ID: " + id));
        
        report.setReportStatus(IncidentReport.ReportStatus.REJECTED);
        
        IncidentReport updatedReport = incidentReportRepository.save(report);
        log.info("Incident report {} rejected successfully", id);
        
        return mapToIncidentReportResponse(updatedReport);
    }
    
    /**
     * Get high severity incident reports
     */
    public List<IncidentReportResponse> getHighSeverityReports() {
        log.debug("Fetching high severity incident reports");
        return incidentReportRepository.findHighSeverityReports().stream()
            .map(this::mapToIncidentReportResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get submitted incident reports
     */
    public Page<IncidentReportResponse> getSubmittedReports(Pageable pageable) {
        log.debug("Fetching submitted incident reports");
        return incidentReportRepository.findAllSubmittedReports(pageable)
            .map(this::mapToIncidentReportResponse);
    }
    
    /**
     * Map IncidentReport entity to IncidentReportResponse DTO
     */
    private IncidentReportResponse mapToIncidentReportResponse(IncidentReport report) {
        return IncidentReportResponse.builder()
            .id(report.getId())
            .outageId(report.getOutageId())
            .safetyDetails(report.getSafetyDetails())
            .rootCause(report.getRootCause())
            .correctiveActions(report.getCorrectiveActions())
            .createdTime(report.getCreatedTime())
            .createdByAnalystId(report.getCreatedByAnalystId())
            .reportStatus(report.getReportStatus().toString())
            .submittedTime(report.getSubmittedTime())
            .severityLevel(report.getSeverityLevel())
            .recommendations(report.getRecommendations())
            .affectedSystem(report.getAffectedSystem())
            .estimatedRecoveryCost(report.getEstimatedRecoveryCost())
            .build();
    }
}
