package com.utilitrack.project._5mdum.US017_20missingReads.dto;

import com.utilitrack.project._5mdum.US017_20missingReads.enums.ReadingQuality;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MeterReadRequest {

    @NotNull(message = "meterId is required")
    private Long meterId;

    @NotNull(message = "readingValue is required")
    private BigDecimal readingValue;

    @NotNull(message = "readingQuality is required")
    private ReadingQuality readingQuality;

    @NotNull(message = "readingDateTime is required")
    private LocalDateTime readingDateTime;

    public MeterReadRequest() {
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
}
