package com.utilitrack.project._5mdum.US017_20missingReads.dto;

import com.utilitrack.project._5mdum.US017_20missingReads.enums.BatchImportStatus;

import java.time.LocalDateTime;
import java.util.List;

public class BatchImportResponse {

    private Long id;
    private String fileName;
    private BatchImportStatus status;
    private Integer totalRecords;
    private Integer successCount;
    private Integer skippedCount;
    private Integer errorCount;
    private LocalDateTime createdAt;
    private List<BatchImportErrorDto> errors;

    public BatchImportResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public BatchImportStatus getStatus() {
        return status;
    }

    public void setStatus(BatchImportStatus status) {
        this.status = status;
    }

    public Integer getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(Integer totalRecords) {
        this.totalRecords = totalRecords;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getSkippedCount() {
        return skippedCount;
    }

    public void setSkippedCount(Integer skippedCount) {
        this.skippedCount = skippedCount;
    }

    public Integer getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(Integer errorCount) {
        this.errorCount = errorCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<BatchImportErrorDto> getErrors() {
        return errors;
    }

    public void setErrors(List<BatchImportErrorDto> errors) {
        this.errors = errors;
    }
}
