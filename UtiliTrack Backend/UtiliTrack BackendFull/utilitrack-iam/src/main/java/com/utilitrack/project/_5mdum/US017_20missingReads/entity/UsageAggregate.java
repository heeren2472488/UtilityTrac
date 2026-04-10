package com.utilitrack.project._5mdum.US017_20missingReads.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

// US020: As a Billing, I want to aggregate usage so that billing ready
@Entity
@Table(name = "usage_aggregates")
public class UsageAggregate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "meter_id", nullable = false)
    private String meterId;

    @Column(name = "billing_period_start", nullable = false)
    private LocalDate billingPeriodStart;

    @Column(name = "billing_period_end", nullable = false)
    private LocalDate billingPeriodEnd;

    @Column(name = "total_usage", nullable = false, precision = 14, scale = 4)
    private BigDecimal totalUsage = BigDecimal.ZERO;

    @Column(name = "actual_reads", nullable = false)
    private int actualReads = 0;

    @Column(name = "estimated_reads", nullable = false)
    private int estimatedReads = 0;

    @Column(name = "missing_reads", nullable = false)
    private int missingReads = 0;

    @Column(name = "tariff_id")
    private Long tariffId;

    @Column(name = "calculated_amount", precision = 12, scale = 2)
    private BigDecimal calculatedAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "aggregation_status", nullable = false)
    private AggregationStatus aggregationStatus = AggregationStatus.PENDING;

    @Column(name = "billing_ready", nullable = false)
    private boolean billingReady = false;

    @Column(name = "aggregated_at")
    private LocalDateTime aggregatedAt;

    @Column(name = "report_generated", nullable = false)
    private boolean reportGenerated = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum AggregationStatus {
        PENDING, IN_PROGRESS, COMPLETED, FAILED
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getMeterId() { return meterId; }
    public void setMeterId(String meterId) { this.meterId = meterId; }
    public LocalDate getBillingPeriodStart() { return billingPeriodStart; }
    public void setBillingPeriodStart(LocalDate billingPeriodStart) { this.billingPeriodStart = billingPeriodStart; }
    public LocalDate getBillingPeriodEnd() { return billingPeriodEnd; }
    public void setBillingPeriodEnd(LocalDate billingPeriodEnd) { this.billingPeriodEnd = billingPeriodEnd; }
    public BigDecimal getTotalUsage() { return totalUsage; }
    public void setTotalUsage(BigDecimal totalUsage) { this.totalUsage = totalUsage; }
    public int getActualReads() { return actualReads; }
    public void setActualReads(int actualReads) { this.actualReads = actualReads; }
    public int getEstimatedReads() { return estimatedReads; }
    public void setEstimatedReads(int estimatedReads) { this.estimatedReads = estimatedReads; }
    public int getMissingReads() { return missingReads; }
    public void setMissingReads(int missingReads) { this.missingReads = missingReads; }
    public Long getTariffId() { return tariffId; }
    public void setTariffId(Long tariffId) { this.tariffId = tariffId; }
    public BigDecimal getCalculatedAmount() { return calculatedAmount; }
    public void setCalculatedAmount(BigDecimal calculatedAmount) { this.calculatedAmount = calculatedAmount; }
    public AggregationStatus getAggregationStatus() { return aggregationStatus; }
    public void setAggregationStatus(AggregationStatus aggregationStatus) { this.aggregationStatus = aggregationStatus; }
    public boolean isBillingReady() { return billingReady; }
    public void setBillingReady(boolean billingReady) { this.billingReady = billingReady; }
    public LocalDateTime getAggregatedAt() { return aggregatedAt; }
    public void setAggregatedAt(LocalDateTime aggregatedAt) { this.aggregatedAt = aggregatedAt; }
    public boolean isReportGenerated() { return reportGenerated; }
    public void setReportGenerated(boolean reportGenerated) { this.reportGenerated = reportGenerated; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
