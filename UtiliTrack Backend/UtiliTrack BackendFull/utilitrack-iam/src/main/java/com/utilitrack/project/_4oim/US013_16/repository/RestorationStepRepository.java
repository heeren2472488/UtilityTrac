package com.utilitrack.project._4oim.US013_16.repository;

import com.utilitrack.project._4oim.US013_16.entity.RestorationStep;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * RestorationStepRepository
 * Provides database access for RestorationStep entity
 */
@Repository
public interface RestorationStepRepository extends JpaRepository<RestorationStep, Long> {

    /**
     * Find all restoration steps for a specific outage ordered by sequence
     */
    @Query("""
        SELECT rs
        FROM RestorationStep rs
        WHERE rs.outageId = :outageId
        ORDER BY rs.stepSequence ASC
    """)
    List<RestorationStep> findByOutageIdOrderBySequence(@Param("outageId") Long outageId);

    /**
     * Find all restoration steps for a specific outage with pagination
     */
    Page<RestorationStep> findByOutageId(Long outageId, Pageable pageable);

    /**
     * Find all restoration steps by status
     */
    Page<RestorationStep> findByStepStatus(RestorationStep.StepStatus status, Pageable pageable);

    /**
     * Find all incomplete restoration steps for an outage
     */
    @Query("""
        SELECT rs
        FROM RestorationStep rs
        WHERE rs.outageId = :outageId
          AND rs.stepStatus NOT IN ('COMPLETED', 'SKIPPED')
    """)
    List<RestorationStep> findIncompleteStepsByOutageId(@Param("outageId") Long outageId);

    /**
     * Find all restoration steps assigned to a specific operator
     */
    List<RestorationStep> findByAssignedToOperatorId(String operatorId);

    /**
     * Count completed steps for an outage
     */
    @Query("""
        SELECT COUNT(rs)
        FROM RestorationStep rs
        WHERE rs.outageId = :outageId
          AND rs.stepStatus = 'COMPLETED'
    """)
    long countCompletedStepsByOutageId(@Param("outageId") Long outageId);

    /**
     * Count total steps for an outage
     */
    @Query("""
        SELECT COUNT(rs)
        FROM RestorationStep rs
        WHERE rs.outageId = :outageId
    """)
    long countByOutageId(@Param("outageId") Long outageId);

    /**
     * Calculate progress percentage for an outage
     */
    @Query("""
        SELECT CAST(
            (COUNT(CASE WHEN rs.stepStatus = 'COMPLETED' THEN 1 END) * 100) / COUNT(rs)
            AS INTEGER
        )
        FROM RestorationStep rs
        WHERE rs.outageId = :outageId
    """)
    Integer calculateProgressPercentageByOutageId(@Param("outageId") Long outageId);

    /**
     * ✅ Find overdue restoration steps (FIXED for Hibernate 6)
     *
     * Uses MySQL TIMESTAMPDIFF to calculate duration in minutes
     */
    @Query(
            value = """
            SELECT *
            FROM restoration_step rs
            WHERE rs.step_status = 'IN_PROGRESS'
              AND rs.estimated_duration_minutes IS NOT NULL
              AND rs.started_time IS NOT NULL
              AND TIMESTAMPDIFF(
                    MINUTE,
                    rs.started_time,
                    CURRENT_TIMESTAMP
                  ) > rs.estimated_duration_minutes
        """,
            nativeQuery = true
    )
    List<RestorationStep> findOverdueSteps();

    /**
     * Find steps completed within a time range
     */
    @Query("""
        SELECT rs
        FROM RestorationStep rs
        WHERE rs.completedTime BETWEEN :startTime AND :endTime
    """)
    List<RestorationStep> findByCompletedTimeBetween(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}