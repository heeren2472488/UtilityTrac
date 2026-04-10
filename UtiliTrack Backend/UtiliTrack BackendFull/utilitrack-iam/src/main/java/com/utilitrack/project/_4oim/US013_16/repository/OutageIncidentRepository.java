package com.utilitrack.project._4oim.US013_16.repository;

import com.utilitrack.project._4oim.US013_16.entity.Outage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * OutageRepository
 * Provides database access for Outage entity
 */
@Repository
public interface OutageIncidentRepository extends JpaRepository<Outage, Long> {
    
    /**
     * Find all outages by region
     */
    List<Outage> findByRegion(String region);
    
    /**
     * Find all outages by status with pagination
     */
    Page<Outage> findByStatus(Outage.OutageStatus status, Pageable pageable);
    
    /**
     * Find all outages for a specific time range
     */
    @Query("SELECT o FROM Outage o WHERE o.loggedTime BETWEEN :startTime AND :endTime")
    List<Outage> findByLoggedTimeBetween(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
    
    /**
     * Find all outages by region and status
     */
    Page<Outage> findByRegionAndStatus(String region, Outage.OutageStatus status, Pageable pageable);
    
    /**
     * Find all outages logged by a specific operator
     */
    List<Outage> findByLoggedByOperatorId(String operatorId);
    
    /**
     * Count outages by status
     */
    long countByStatus(Outage.OutageStatus status);
    
    /**
     * Find all unresolved outages (not RESTORED or CLOSED)
     */
    @Query("SELECT o FROM Outage o WHERE o.status NOT IN ('RESTORED', 'CLOSED')")
    List<Outage> findAllUnresolvedOutages();
    
    /**
     * Find outages by severity level
     */
    List<Outage> findBySeverityLevel(String severityLevel);
}
