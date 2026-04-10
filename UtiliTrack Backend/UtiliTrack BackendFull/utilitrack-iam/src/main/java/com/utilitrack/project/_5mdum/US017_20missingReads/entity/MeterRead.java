package com.utilitrack.project._5mdum.US017_20missingReads.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;



import com.utilitrack.project._5mdum.US017_20missingReads.enums.ReadSource;
import com.utilitrack.project._5mdum.US017_20missingReads.enums.ReadingQuality;

@Entity
@Table(name = "meter_read")
public class MeterRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* ---------------- Core Meter Fields ---------------- */

    @Column(name = "meter_id", nullable = false)
    private Long meterId;

    @Column(name = "customer_id")
    private String customerId;

    @Column(name = "reading_value", precision = 15, scale = 4)
    private BigDecimal readingValue;

    @Column(name = "reading_date_time", nullable = false)
    private LocalDateTime readingDateTime;

    /* ---------------- Quality & Source ---------------- */

    @Enumerated(EnumType.STRING)
    @Column(name = "reading_quality")
    private ReadingQuality readingQuality;

    @Enumerated(EnumType.STRING)
    @Column(name = "read_source")
    private ReadSource readSource;

    /* ---------------- Billing / Missing Read Logic ---------------- */

    @Enumerated(EnumType.STRING)
    @Column(name = "read_type", nullable = false)
    private ReadType readType = ReadType.ACTUAL;

    @Column(name = "is_missing", nullable = false)
    private boolean missing = false;

    @Column(name = "estimated_value", precision = 15, scale = 4)
    private BigDecimal estimatedValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "estimation_method")
    private EstimationMethod estimationMethod;

    @Column(name = "estimation_note", columnDefinition = "TEXT")
    private String estimationNote;

    @Column(name = "gap_filled", nullable = false)
    private boolean gapFilled = false;

    /* ---------------- Audit Fields ---------------- */

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

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    /* ---------------- Enums ---------------- */

    public enum ReadType {
        ACTUAL, ESTIMATED, INTERPOLATED
    }

    public enum EstimationMethod {
        LINEAR_INTERPOLATION,
        AVERAGE_DAILY_USAGE,
        PREVIOUS_PERIOD,
        MANUAL
    }

    /* ---------------- Getters & Setters ---------------- */

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMeterId() { return meterId; }
    public void setMeterId(Long meterId) { this.meterId = meterId; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public BigDecimal getReadingValue() { return readingValue; }
    public void setReadingValue(BigDecimal readingValue) { this.readingValue = readingValue; }

    public LocalDateTime getReadingDateTime() { return readingDateTime; }
    public void setReadingDateTime(LocalDateTime readingDateTime) { this.readingDateTime = readingDateTime; }

    public ReadingQuality getReadingQuality() { return readingQuality; }
    public void setReadingQuality(ReadingQuality readingQuality) { this.readingQuality = readingQuality; }

    public ReadSource getReadSource() { return readSource; }
    public void setReadSource(ReadSource readSource) { this.readSource = readSource; }

    public ReadType getReadType() { return readType; }
    public void setReadType(ReadType readType) { this.readType = readType; }

    public boolean isMissing() { return missing; }
    public void setMissing(boolean missing) { this.missing = missing; }

    public BigDecimal getEstimatedValue() { return estimatedValue; }
    public void setEstimatedValue(BigDecimal estimatedValue) { this.estimatedValue = estimatedValue; }

    public EstimationMethod getEstimationMethod() { return estimationMethod; }
    public void setEstimationMethod(EstimationMethod estimationMethod) { this.estimationMethod = estimationMethod; }

    public String getEstimationNote() { return estimationNote; }
    public void setEstimationNote(String estimationNote) { this.estimationNote = estimationNote; }

    public boolean isGapFilled() { return gapFilled; }
    public void setGapFilled(boolean gapFilled) { this.gapFilled = gapFilled; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}