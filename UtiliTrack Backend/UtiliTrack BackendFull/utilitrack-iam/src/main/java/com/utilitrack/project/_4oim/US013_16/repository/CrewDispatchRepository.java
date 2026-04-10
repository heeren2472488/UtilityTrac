package com.utilitrack.project._4oim.US013_16.repository;

import com.utilitrack.project._4oim.US013_16.entity.CrewDispatch;
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
 * CrewDispatchRepository
 * Provides database access for CrewDispatch entity
 */
@Repository
public interface CrewDispatchRepository extends JpaRepository<CrewDispatch, Long> {
    
    /**
     * Find all crew dispatches for a specific outage
     */
    List<CrewDispatch> findByOutageId(Long outageId);
    
    /**
     * Find all crew dispatches for a specific outage with pagination
     */
    Page<CrewDispatch> findByOutageId(Long outageId, Pageable pageable);
    
    /**
     * Find all crew dispatches by dispatch status
     */
    Page<CrewDispatch> findByDispatchStatus(CrewDispatch.DispatchStatus status, Pageable pageable);
    
    /**
     * Find all crew dispatches by crew ID
     */
    List<CrewDispatch> findByCrewId(String crewId);
    
    /**
     * Find all active crew dispatches (not COMPLETED or CANCELLED)
     */
    @Query("SELECT cd FROM CrewDispatch cd WHERE cd.dispatchStatus NOT IN ('COMPLETED', 'CANCELLED')")
    List<CrewDispatch> findAllActiveDispatches();
    
    /**
     * Find all crew dispatches dispatched by a specific operator
     */
    List<CrewDispatch> findByDispatchedByOperatorId(String operatorId);
    
    /**
     * Find crew dispatches with late arrival (actual arrival after ETA)
     */
    @Query("SELECT cd FROM CrewDispatch cd WHERE cd.actualArrivalTime > cd.estimatedTimeOfArrival")
    List<CrewDispatch> findLateArrivals();
    
    /**
     * Count active crew dispatches for a specific outage
     */
    long countByOutageIdAndDispatchStatusNotIn(Long outageId, List<CrewDispatch.DispatchStatus> statuses);
    
    /**
     * Find crew dispatches dispatched within a time range
     */
    @Query("SELECT cd FROM CrewDispatch cd WHERE cd.dispatchTime BETWEEN :startTime AND :endTime")
    List<CrewDispatch> findByDispatchTimeBetween(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
}
