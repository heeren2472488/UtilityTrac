package com.utilitrack.project._5mdum.US017_20missingReads.repository;

import com.utilitrack.project._5mdum.US017_20missingReads.entity.UsageAggregate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsageAggregateRepository extends JpaRepository<UsageAggregate, Long> {

    List<UsageAggregate> findByCustomerId(String customerId);

    List<UsageAggregate> findByBillingReadyTrue();

    List<UsageAggregate> findByAggregationStatus(UsageAggregate.AggregationStatus status);

    Optional<UsageAggregate> findByCustomerIdAndMeterIdAndBillingPeriodStartAndBillingPeriodEnd(
            String customerId, String meterId, LocalDate start, LocalDate end);

    @Query("SELECT u FROM UsageAggregate u WHERE u.customerId = :customerId AND u.billingPeriodStart >= :from AND u.billingPeriodEnd <= :to")
    List<UsageAggregate> findByCustomerAndPeriod(
            @Param("customerId") String customerId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("SELECT u FROM UsageAggregate u WHERE u.billingReady = true AND u.reportGenerated = false")
    List<UsageAggregate> findBillingReadyNotReported();
}
