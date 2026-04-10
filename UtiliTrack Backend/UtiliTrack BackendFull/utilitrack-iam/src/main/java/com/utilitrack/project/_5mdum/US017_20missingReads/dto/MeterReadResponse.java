package com.utilitrack.project._5mdum.US017_20missingReads.dto;

import com.utilitrack.project._5mdum.US017_20missingReads.enums.ReadSource;
import com.utilitrack.project._5mdum.US017_20missingReads.enums.ReadingQuality;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MeterReadResponse {

    private Long id;
    private Long meterId;
    private BigDecimal readingValue;
    private ReadingQuality readingQuality;
    private LocalDateTime readingDateTime;
    private ReadSource readSource;
    private LocalDateTime createdAt;

    public MeterReadResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMeterId() {
        return meterId;
    }

    public void setMeterId(Long meterId) {
        this.meterId = meterId;
    }

    public BigDecimal getReadingValue() {
        return readingValue;
    }

    public void setReadingValue(BigDecimal readingValue) {
        this.readingValue = readingValue;
    }

    public ReadingQuality getReadingQuality() {
        return readingQuality;
    }

    public void setReadingQuality(ReadingQuality readingQuality) {
        this.readingQuality = readingQuality;
    }

    public LocalDateTime getReadingDateTime() {
        return readingDateTime;
    }

    public void setReadingDateTime(LocalDateTime readingDateTime) {
        this.readingDateTime = readingDateTime;
    }

    public ReadSource getReadSource() {
        return readSource;
    }

    public void setReadSource(ReadSource readSource) {
        this.readSource = readSource;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
