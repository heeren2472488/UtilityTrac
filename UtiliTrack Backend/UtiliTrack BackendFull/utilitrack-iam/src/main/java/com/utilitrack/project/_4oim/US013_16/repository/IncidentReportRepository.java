package com.utilitrack.project._4oim.US013_16.repository;

import com.utilitrack.project._4oim.US013_16.entity.IncidentReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * IncidentReportRepository
 * Provides database access for IncidentReport entity
 */
@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {
    
    /**
     * Find all incident reports for a specific outage
     */
    List<IncidentReport> findByOutageId(Long outageId);
    
    /**
     * Find incident reports by analyst with pagination
     */
    Page<IncidentReport> findByCreatedByAnalystId(String analystId, Pageable pageable);
    
    /**
     * Find incident reports by status with pagination
     */
    Page<IncidentReport> findByReportStatus(IncidentReport.ReportStatus status, Pageable pageable);
    
    /**
     * Find incident reports by severity level
     */
    List<IncidentReport> findBySeverityLevel(String severityLevel);
    
    /**
     * Find all submitted incident reports
     */
    @Query("SELECT ir FROM IncidentReport ir WHERE ir.reportStatus = 'SUBMITTED'")
    Page<IncidentReport> findAllSubmittedReports(Pageable pageable);
    
    /**
     * Find incident reports created within a time range
     */
    @Query("SELECT ir FROM IncidentReport ir WHERE ir.createdTime BETWEEN :startTime AND :endTime")
    List<IncidentReport> findByCreatedTimeBetween(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
    
    /**
     * Find the latest incident report for an outage
     */
    @Query("SELECT ir FROM IncidentReport ir WHERE ir.outageId = :outageId ORDER BY ir.createdTime DESC LIMIT 1")
    Optional<IncidentReport> findLatestReportByOutageId(@Param("outageId") Long outageId);
    
    /**
     * Count incident reports by status
     */
    long countByReportStatus(IncidentReport.ReportStatus status);
    
    /**
     * Find high-severity incident reports
     */
    @Query("SELECT ir FROM IncidentReport ir WHERE ir.severityLevel IN ('HIGH', 'CRITICAL') ORDER BY ir.createdTime DESC")
    List<IncidentReport> findHighSeverityReports();
    
    /**
     * Find incident reports pending approval
     */
    @Query("SELECT ir FROM IncidentReport ir WHERE ir.reportStatus IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW')")
    Page<IncidentReport> findPendingApprovalReports(Pageable pageable);
}
