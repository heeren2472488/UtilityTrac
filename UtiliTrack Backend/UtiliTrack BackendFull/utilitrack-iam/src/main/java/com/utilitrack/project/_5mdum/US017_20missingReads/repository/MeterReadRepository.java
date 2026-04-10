package com.utilitrack.project._5mdum.US017_20missingReads.repository;

import com.utilitrack.project._5mdum.US017_20missingReads.entity.MeterRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MeterReadRepository extends JpaRepository<MeterRead, Long> {

    /* =====================================================
       BASIC FETCH OPERATIONS
       ===================================================== */

    List<MeterRead> findByMeterIdOrderByReadingDateTimeDesc(Long meterId);

    List<MeterRead> findByMeterIdOrderByReadingDateTimeAsc(Long meterId);

    List<MeterRead> findByMeterIdAndReadingDateTimeBetweenOrderByReadingDateTimeDesc(
            Long meterId,
            LocalDateTime from,
            LocalDateTime to
    );

    /* =====================================================
       MISSING READ LOGIC
       ===================================================== */

    List<MeterRead> findByMissingTrue();

    List<MeterRead> findByMissingTrueAndGapFilledFalse();

    long countByMissingTrue();

    long countByGapFilledTrue();

    /* =====================================================
       ADVANCED RANGE QUERIES
       ===================================================== */

    @Query("""
        SELECT m FROM MeterRead m
        WHERE m.meterId = :meterId
          AND m.readingDateTime BETWEEN :from AND :to
        ORDER BY m.readingDateTime
    """)
    List<MeterRead> findByMeterIdAndDateRange(
            @Param("meterId") Long meterId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
        SELECT m FROM MeterRead m
        WHERE m.customerId = :customerId
          AND m.readingDateTime BETWEEN :from AND :to
        ORDER BY m.readingDateTime
    """)
    List<MeterRead> findByCustomerIdAndDateRange(
            @Param("customerId") String customerId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    /* =====================================================
       DUPLICATE PREVENTION
       ===================================================== */

    @Query("""
        SELECT COUNT(m) > 0 FROM MeterRead m
        WHERE m.meterId = :meterId
          AND m.readingDateTime = :readingDateTime
          AND m.readingValue = :readingValue
    """)
    boolean existsDuplicate(
            @Param("meterId") Long meterId,
            @Param("readingDateTime") LocalDateTime readingDateTime,
            @Param("readingValue") BigDecimal readingValue
    );
}